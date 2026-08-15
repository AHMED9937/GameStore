import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaddleService } from './paddle.service';
import { PaddleConfig } from './paddle.config';

const VALID_PADDLE_API_KEY =
  'pdl_sdbx_apikey_abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUV_ABC';

describe('PaddleService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('health returns ok when configured', () => {
    process.env.PADDLE_API_KEY = VALID_PADDLE_API_KEY;
    process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET = 'pdl_ntfset_testsecret123';
    process.env.NEXT_PUBLIC_PADDLE_ENV = 'sandbox';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

    const service = new PaddleService();
    expect(service.health()).toMatchObject({
      status: 'ok',
      integration: 'paddle',
    });
  });

  it('health returns misconfigured when API key is missing', () => {
    delete process.env.PADDLE_API_KEY;
    process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET = 'pdl_ntfset_testsecret123';
    process.env.NEXT_PUBLIC_PADDLE_ENV = 'sandbox';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

    const service = new PaddleService();
    expect(service.health()).toMatchObject({
      status: 'misconfigured',
      integration: 'paddle',
    });
  });

  it('createCheckout throws when productId is missing', async () => {
    process.env.PADDLE_API_KEY = VALID_PADDLE_API_KEY;
    process.env.NEXT_PUBLIC_PADDLE_ENV = 'sandbox';

    const service = new PaddleService();
    await expect(
      service.createCheckoutTransaction({
        gameId: 'game-1',
        gameSlug: 'demo-game',
        title: 'Demo Game',
        productId: '',
        priceBase: 19.99,
      }),
    ).rejects.toThrow('Game is missing a Paddle product ID');
  });

  it('createSubscriptionCheckoutTransaction throws when providerPriceId is missing', async () => {
    process.env.PADDLE_API_KEY = VALID_PADDLE_API_KEY;
    process.env.NEXT_PUBLIC_PADDLE_ENV = 'sandbox';

    const service = new PaddleService();
    await expect(
      service.createSubscriptionCheckoutTransaction({
        planId: 'plan-1',
        planSlug: 'all-access',
        providerPriceId: '',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Subscription plan is missing a Paddle price ID');
  });

  it('isCheckoutConfigured returns true when API key and env are set', () => {
    process.env.PADDLE_API_KEY = VALID_PADDLE_API_KEY;
    process.env.NEXT_PUBLIC_PADDLE_ENV = 'sandbox';

    expect(PaddleConfig.isCheckoutConfigured()).toBe(true);
  });

  it('isCheckoutConfigured returns false when env is missing', () => {
    delete process.env.PADDLE_API_KEY;

    expect(PaddleConfig.isCheckoutConfigured()).toBe(false);
  });
});
