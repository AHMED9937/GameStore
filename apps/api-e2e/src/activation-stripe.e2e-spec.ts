import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import Stripe from 'stripe';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ClerkAuthGuard } from '@gamestore/api/auth';
import { PrismaService } from '@gamestore/api/prisma';
import { SteamCryptoService } from '@gamestore/api/steam';
import { StripeService } from '@gamestore/api/stripe';
import { AppModule } from '../../api/src/app/app.module';
import {
  authAs,
  closeE2eApp,
  ensurePublishedDemoGame,
  seedE2eUsers,
} from './support/e2e-app';
import { E2eClerkAuthGuard } from './support/e2e-auth.guard';
import { E2E_TOKENS } from './support/e2e-auth.tokens';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const TEST_ENCRYPTION_KEY = 'd'.repeat(64);
const E2E_SESSION_ID = 'cs_test_e2e_steam_activation';
const E2E_WEBHOOK_SECRET = 'whsec_e2e_steam_activation';
const TEST_PASSWORD = 'stripe-path-steam-password';
const TEST_SHARED_SECRET = 'testsharedsecretfortotp123456';

function signStripeWebhook(payload: string) {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: E2E_WEBHOOK_SECRET,
  });
}

describe.skipIf(!hasDatabase)('Stripe checkout → activation → Steam Guard', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stripeService: StripeService;
  let licenseKey = '';

  beforeAll(async () => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', TEST_ENCRYPTION_KEY);
    vi.stubEnv('STEAM_GUARD_COOLDOWN_MINUTES', '1');
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_e2e_steam');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', E2E_WEBHOOK_SECRET);
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_e2e_steam');

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
    await ensurePublishedDemoGame(prisma);

    const game = await prisma.game.findFirst({
      where: { slug: 'demo-game-1', publishedAt: { not: null } },
      include: {
        accounts: {
          where: { username: 'pool-demo-game-1', isActive: true },
        },
      },
    });

    if (!game) {
      throw new Error('demo-game-1 is required for Stripe activation e2e');
    }

    const crypto = new SteamCryptoService();
    const pool = game.accounts[0];
    if (pool) {
      await prisma.gameAccount.update({
        where: { id: pool.id },
        data: {
          passwordEncrypted: crypto.encrypt(TEST_PASSWORD),
          sharedSecret: crypto.encrypt(TEST_SHARED_SECRET),
          lockedUntil: null,
        },
      });
    } else {
      await prisma.gameAccount.create({
        data: {
          gameId: game.id,
          platform: 'steam',
          username: 'pool-demo-game-1',
          passwordEncrypted: crypto.encrypt(TEST_PASSWORD),
          sharedSecret: crypto.encrypt(TEST_SHARED_SECRET),
          region: 'global',
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { stripeSessionId: E2E_SESSION_ID },
    });
    await closeE2eApp(app);
    vi.unstubAllEnvs();
  });

  it('checkout → webhook → activate → guard completes paid buyer path', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/checkout')
      .set(authAs(E2E_TOKENS.userA))
      .send({ slug: 'demo-game-1' })
      .expect(200);

    const order = await prisma.order.findUnique({
      where: { stripeSessionId: E2E_SESSION_ID },
    });
    expect(order).toBeTruthy();

    const session = {
      id: E2E_SESSION_ID,
      object: 'checkout.session',
      payment_status: 'paid',
      amount_total: 1999,
      payment_intent: 'pi_test_steam_activation',
      metadata: {
        gameId: order!.gameId,
        gameSlug: 'demo-game-1',
        userId: order!.ownerId ?? '',
      },
      customer_details: {
        email: 'stripe-activation@example.com',
      },
    };

    const payload = JSON.stringify({
      id: 'evt_steam_activation_checkout',
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: session },
    });

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signStripeWebhook(payload))
      .send(payload)
      .expect(200);

    const fulfilled = await request(app.getHttpServer())
      .get(`/api/orders/by-session/${E2E_SESSION_ID}`)
      .set(authAs(E2E_TOKENS.userA))
      .expect(200);

    licenseKey = fulfilled.body.license.licenseKey;
    expect(licenseKey).toMatch(/^GS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

    const activation = await request(app.getHttpServer())
      .post('/api/licenses/activate')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey })
      .expect(200);

    expect(activation.body).toMatchObject({
      status: 'activated',
      account: {
        password: TEST_PASSWORD,
      },
    });

    const guard = await request(app.getHttpServer())
      .post('/api/steam/guard-code')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey })
      .expect(201);

    expect(guard.body.code).toMatch(/^[A-Z0-9]{5}$/);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn(
    'Skipping Stripe activation API e2e tests: DATABASE_URL is not set',
  );
}
