import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import Stripe from 'stripe';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ClerkAuthGuard } from '@gamestore/api/auth';
import { PrismaService } from '@gamestore/api/prisma';
import { StripeService } from '@gamestore/api/stripe';
import { AppModule } from '../../api/src/app/app.module';
import {
  authAs,
  closeE2eApp,
  seedE2eUsers,
} from './support/e2e-app';
import { E2eClerkAuthGuard } from './support/e2e-auth.guard';
import { E2E_TOKENS } from './support/e2e-auth.tokens';

const hasDatabase = Boolean(process.env.DATABASE_URL);

const E2E_SUB_SESSION_ID = 'cs_test_e2e_subscription_session';
const E2E_STRIPE_SUB_ID = 'sub_test_e2e_subscription';
const E2E_WEBHOOK_SECRET = 'whsec_e2e_sub';

const periodStart = Math.floor(Date.now() / 1000);
const periodEnd = periodStart + 30 * 24 * 60 * 60;

function signStripeWebhook(payload: string) {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: E2E_WEBHOOK_SECRET,
  });
}

describe.skipIf(!hasDatabase)('Stripe subscription routes', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stripeService: StripeService;
  let planId = '';
  let planSlug = '';
  let userId = '';
  let userSubscriptionId = '';

  beforeAll(async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_e2e_sub');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', E2E_WEBHOOK_SECRET);
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_e2e_sub');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ClerkAuthGuard)
      .useClass(E2eClerkAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);
    stripeService = app.get(StripeService);

    vi.spyOn(stripeService, 'createSubscriptionCheckoutSession').mockResolvedValue({
      sessionId: E2E_SUB_SESSION_ID,
      url: `https://checkout.stripe.com/pay/${E2E_SUB_SESSION_ID}`,
    });
    vi.spyOn(stripeService, 'retrieveSubscription').mockResolvedValue({
      id: E2E_STRIPE_SUB_ID,
      status: 'active',
      cancel_at_period_end: false,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      items: {
        data: [
          {
            current_period_start: periodStart,
            current_period_end: periodEnd,
          },
        ],
      },
    } as never);

    const users = await seedE2eUsers(app);
    userId = users.userA.id;

    const game = await prisma.game.findFirst({
      where: { slug: 'demo-game-1', publishedAt: { not: null } },
    });

    if (!game) {
      return;
    }

    planSlug = `e2e-sub-plan-${Date.now()}`;
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'E2E Subscription',
        slug: planSlug,
        stripePriceId: `price_${planSlug}`,
        interval: 'month',
        intervalCount: 1,
        isActive: true,
        games: {
          create: [{ gameId: game.id }],
        },
      },
    });
    planId = plan.id;

    await prisma.license.deleteMany({
      where: { subscription: { stripeSubscriptionId: E2E_STRIPE_SUB_ID } },
    });
    await prisma.userSubscription.deleteMany({
      where: { stripeSubscriptionId: E2E_STRIPE_SUB_ID },
    });
  });

  afterAll(async () => {
    if (userSubscriptionId) {
      await prisma.license.deleteMany({
        where: { subscriptionId: userSubscriptionId },
      });
      await prisma.userSubscription
        .delete({ where: { id: userSubscriptionId } })
        .catch(() => undefined);
    }
    if (planId) {
      await prisma.subscriptionPlanGame
        .deleteMany({ where: { planId } })
        .catch(() => undefined);
      await prisma.subscriptionPlan
        .delete({ where: { id: planId } })
        .catch(() => undefined);
    }
    await closeE2eApp(app);
    vi.unstubAllEnvs();
  });

  it('GET /api/subscription-plans returns active public plans', async () => {
    if (!planSlug) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/api/subscription-plans')
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: planSlug,
          name: 'E2E Subscription',
          games: [
            expect.objectContaining({
              slug: 'demo-game-1',
            }),
          ],
        }),
      ]),
    );
    expect(response.body[0]).not.toHaveProperty('stripePriceId');
  });

  it('POST /api/payments/subscription-checkout returns a Stripe session for an active plan', async () => {
    if (!planSlug) {
      return;
    }

    const response = await request(app.getHttpServer())
      .post('/api/payments/subscription-checkout')
      .set(authAs(E2E_TOKENS.userA))
      .send({ planSlug })
      .expect(200);

    expect(response.body).toEqual({
      sessionId: E2E_SUB_SESSION_ID,
      url: `https://checkout.stripe.com/pay/${E2E_SUB_SESSION_ID}`,
    });
  });

  it('POST /api/payments/subscription-checkout requires authentication', async () => {
    if (!planSlug) {
      return;
    }

    await request(app.getHttpServer())
      .post('/api/payments/subscription-checkout')
      .send({ planSlug })
      .expect(401);
  });

  it('POST /api/payments/webhook fulfills subscription checkout.session.completed', async () => {
    if (!planId || !planSlug) {
      return;
    }

    const session = {
      id: E2E_SUB_SESSION_ID,
      object: 'checkout.session',
      mode: 'subscription',
      payment_status: 'paid',
      subscription: E2E_STRIPE_SUB_ID,
      metadata: {
        planId,
        planSlug,
        userId,
      },
      customer_details: {
        email: 'buyer-e2e-sub@example.com',
      },
    };

    const payload = JSON.stringify({
      id: 'evt_e2e_subscription_checkout_completed',
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: session },
    });

    const response = await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signStripeWebhook(payload))
      .send(payload)
      .expect(200);

    expect(response.body).toEqual({
      received: true,
      action: 'subscription_fulfilled',
    });

    const userSubscription = await prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: E2E_STRIPE_SUB_ID },
      include: {
        licenses: {
          include: { game: true },
        },
        plan: true,
      },
    });

    expect(userSubscription).not.toBeNull();
    expect(userSubscription?.userId).toBe(userId);
    expect(userSubscription?.planId).toBe(planId);
    expect(userSubscription?.status).toBe('active');
    expect(userSubscription?.licenses).toHaveLength(1);
    expect(userSubscription?.licenses[0]).toMatchObject({
      source: 'subscription',
      status: 'available',
      buyerEmail: 'buyer-e2e-sub@example.com',
    });
    expect(userSubscription?.licenses[0]?.game.slug).toBe('demo-game-1');
    expect(userSubscription?.licenses[0]?.expiresAt).toBeInstanceOf(Date);
    userSubscriptionId = userSubscription?.id ?? '';
  });

  it('GET /api/subscriptions/mine returns the buyer subscription with licenses', async () => {
    if (!userSubscriptionId) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/api/subscriptions/mine')
      .set(authAs(E2E_TOKENS.userA))
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        id: userSubscriptionId,
        status: 'active',
        cancelAtPeriodEnd: false,
        plan: expect.objectContaining({
          slug: planSlug,
          name: 'E2E Subscription',
        }),
        licenses: [
          expect.objectContaining({
            status: 'available',
            licenseKey: expect.stringMatching(
              /^GS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/,
            ),
            game: expect.objectContaining({ slug: 'demo-game-1' }),
          }),
        ],
      }),
    ]);
  });

  it('GET /api/subscriptions/mine returns an empty list for another user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/subscriptions/mine')
      .set(authAs(E2E_TOKENS.userB))
      .expect(200);

    expect(response.body).toEqual([]);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Stripe subscription e2e tests: DATABASE_URL is not set');
}
