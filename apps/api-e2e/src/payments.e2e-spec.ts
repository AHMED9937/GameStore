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

const E2E_SESSION_ID = 'cs_test_e2e_checkout_session';
const E2E_WEBHOOK_SECRET = 'whsec_e2e';

function signStripeWebhook(payload: string) {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: E2E_WEBHOOK_SECRET,
  });
}

describe.skipIf(!hasDatabase)('Stripe payment routes', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stripeService: StripeService;
  let fulfilledLicenseId: string | undefined;

  beforeAll(async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_e2e');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', E2E_WEBHOOK_SECRET);
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_e2e');

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
    vi.spyOn(stripeService, 'createCheckoutSession').mockResolvedValue({
      sessionId: E2E_SESSION_ID,
      url: `https://checkout.stripe.com/pay/${E2E_SESSION_ID}`,
    });
    await seedE2eUsers(app);
  });

  afterAll(async () => {
    if (fulfilledLicenseId) {
      await prisma.license.delete({ where: { id: fulfilledLicenseId } }).catch(() => undefined);
    }
    await prisma.order.deleteMany({
      where: { stripeSessionId: E2E_SESSION_ID },
    });
    await closeE2eApp(app);
    vi.unstubAllEnvs();
  });

  it('GET /api/payments/health returns Stripe env status JSON', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/payments/health')
      .expect(200);

    expect(response.body).toMatchObject({
      integration: 'stripe',
      env: {
        secretKey: expect.stringMatching(/^(missing|invalid|valid)$/),
        webhookSecret: expect.stringMatching(/^(missing|invalid|valid)$/),
        publishableKey: expect.stringMatching(/^(missing|invalid|valid)$/),
      },
    });
    expect(['ok', 'misconfigured']).toContain(response.body.status);
  });

  it('POST /api/payments/checkout creates a pending order and returns session url', async () => {
    const game = await prisma.game.findFirst({
      where: { slug: 'demo-game-1', publishedAt: { not: null } },
    });

    if (!game) {
      return;
    }

    const response = await request(app.getHttpServer())
      .post('/api/payments/checkout')
      .set(authAs(E2E_TOKENS.userA))
      .send({ slug: 'demo-game-1' })
      .expect(200);

    expect(response.body).toEqual({
      sessionId: E2E_SESSION_ID,
      url: `https://checkout.stripe.com/pay/${E2E_SESSION_ID}`,
    });

    const order = await prisma.order.findUnique({
      where: { stripeSessionId: E2E_SESSION_ID },
    });

    expect(order).toMatchObject({
      gameId: game.id,
      status: 'pending',
      ownerId: expect.any(String),
    });
  });

  it('POST /api/payments/checkout returns 404 for unknown slug', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/checkout')
      .send({ slug: 'nonexistent-slug-e2e-checkout' })
      .expect(404);
  });

  it('GET /api/orders/by-session returns pending before webhook fulfillment', async () => {
    const order = await prisma.order.findUnique({
      where: { stripeSessionId: E2E_SESSION_ID },
    });

    if (!order || order.status !== 'pending') {
      return;
    }

    const response = await request(app.getHttpServer())
      .get(`/api/orders/by-session/${E2E_SESSION_ID}`)
      .set(authAs(E2E_TOKENS.userA))
      .expect(202);

    expect(response.body).toEqual({
      status: 'pending',
      message: 'Payment received — issuing your license…',
    });
  });

  it('GET /api/orders/by-session returns 404 for unknown session', async () => {
    await request(app.getHttpServer())
      .get('/api/orders/by-session/cs_test_missing_session')
      .expect(404);
  });

  it('POST /api/payments/webhook fulfills checkout.session.completed', async () => {
    const order = await prisma.order.findUnique({
      where: { stripeSessionId: E2E_SESSION_ID },
      include: { license: true },
    });

    if (!order) {
      return;
    }

    const session = {
      id: E2E_SESSION_ID,
      object: 'checkout.session',
      payment_status: 'paid',
      amount_total: 1999,
      payment_intent: 'pi_test_e2e',
      metadata: {
        gameId: order.gameId,
        gameSlug: 'demo-game-1',
        userId: order.ownerId ?? '',
      },
      customer_details: {
        email: 'buyer-e2e@example.com',
      },
    };

    const payload = JSON.stringify({
      id: 'evt_e2e_checkout_completed',
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
      action: 'fulfilled',
    });

    const fulfilled = await prisma.order.findUnique({
      where: { stripeSessionId: E2E_SESSION_ID },
      include: { license: true },
    });

    expect(fulfilled).toMatchObject({
      status: 'completed',
      buyerEmail: 'buyer-e2e@example.com',
      stripePaymentId: 'pi_test_e2e',
      license: {
        licenseKey: expect.stringMatching(/^GS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/),
        status: 'available',
        gameId: order.gameId,
      },
    });

    fulfilledLicenseId = fulfilled?.license?.id;

    const replay = await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signStripeWebhook(payload))
      .send(payload)
      .expect(200);

    expect(replay.body).toEqual({
      received: true,
      action: 'already_fulfilled',
    });
  });

  it('GET /api/orders/by-session returns completed order with license', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/orders/by-session/${E2E_SESSION_ID}`)
      .set(authAs(E2E_TOKENS.userA))
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'completed',
      order: {
        id: expect.any(String),
        amount: expect.any(String),
        currency: 'USD',
        buyerEmail: 'buyer-e2e@example.com',
      },
      license: {
        licenseKey: expect.stringMatching(/^GS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/),
        status: 'available',
        game: {
          slug: 'demo-game-1',
          title: expect.any(String),
        },
      },
    });
  });

  it('GET /api/orders/by-session returns 403 for another signed-in user', async () => {
    await request(app.getHttpServer())
      .get(`/api/orders/by-session/${E2E_SESSION_ID}`)
      .set(authAs(E2E_TOKENS.userB))
      .expect(403);
  });

  it('POST /api/payments/webhook rejects invalid signatures', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid')
      .send('{}')
      .expect(400);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Stripe API e2e tests: DATABASE_URL is not set');
}
