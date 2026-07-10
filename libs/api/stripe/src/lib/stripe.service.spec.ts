import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StripeService } from './stripe.service';

const sessionsCreate = vi.fn();
const sessionsRetrieve = vi.fn();
const subscriptionsRetrieve = vi.fn();

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        create: sessionsCreate,
        retrieve: sessionsRetrieve,
      },
    };

    subscriptions = {
      retrieve: subscriptionsRetrieve,
    };

    constructor(_key: string, _options?: unknown) {}
  },
}));

describe('StripeService', () => {
  let service: StripeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StripeService();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_abc');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_abc');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');

    sessionsCreate.mockResolvedValue({
      id: 'cs_test_session',
      url: 'https://checkout.stripe.com/pay/cs_test_session',
    });
    sessionsRetrieve.mockResolvedValue({
      id: 'cs_test_session',
      mode: 'payment',
      payment_status: 'paid',
    });
  });

  it('returns env health with per-field status', () => {
    expect(service.health()).toEqual({
      status: 'ok',
      integration: 'stripe',
      env: {
        secretKey: 'valid',
        webhookSecret: 'valid',
        publishableKey: 'valid',
      },
    });

    vi.unstubAllEnvs();
  });

  it('returns setup text for legacy createCheckout without Stripe SDK calls', () => {
    expect(service.createCheckout()).toEqual({
      status: 'setup',
      integration: 'stripe',
      message: 'Stripe checkout not implemented yet',
    });
  });

  it('createCheckoutSession calls Stripe with game line item and metadata', async () => {
    const result = await service.createCheckoutSession({
      gameId: 'game-1',
      gameSlug: 'demo-game-1',
      title: 'Demo Game',
      priceBase: 19.99,
      coverImage: 'https://cdn.example.com/cover.jpg',
      userId: 'user-1',
      customerEmail: 'buyer@example.com',
    });

    expect(sessionsCreate).toHaveBeenCalledWith({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: 1999,
            product_data: {
              name: 'Demo Game',
              images: ['https://cdn.example.com/cover.jpg'],
            },
          },
        },
      ],
      metadata: {
        gameId: 'game-1',
        gameSlug: 'demo-game-1',
        userId: 'user-1',
      },
      success_url:
        'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:
        'http://localhost:3000/checkout?game=demo-game-1&cancelled=1&session_id={CHECKOUT_SESSION_ID}',
      customer_email: 'buyer@example.com',
    });
    expect(result).toEqual({
      sessionId: 'cs_test_session',
      url: 'https://checkout.stripe.com/pay/cs_test_session',
    });

    vi.unstubAllEnvs();
  });

  it('createCheckoutSession omits relative cover image from Stripe payload', async () => {
    await service.createCheckoutSession({
      gameId: 'game-1',
      gameSlug: 'demo-game-1',
      title: 'Demo Game',
      priceBase: 9.99,
      coverImage: '/og/default.png',
    });

    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              product_data: { name: 'Demo Game' },
            }),
          }),
        ],
      }),
    );
    expect(sessionsCreate.mock.calls[0][0].line_items[0].price_data.product_data).not.toHaveProperty(
      'images',
    );

    vi.unstubAllEnvs();
  });

  it('createCheckoutSession omits optional customer email and cover image', async () => {
    await service.createCheckoutSession({
      gameId: 'game-1',
      gameSlug: 'demo-game-1',
      title: 'Demo Game',
      priceBase: 9.99,
    });

    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 999,
              product_data: { name: 'Demo Game' },
            }),
          }),
        ],
        metadata: {
          gameId: 'game-1',
          gameSlug: 'demo-game-1',
          userId: '',
        },
      }),
    );
    expect(sessionsCreate.mock.calls[0][0]).not.toHaveProperty('customer_email');

    vi.unstubAllEnvs();
  });

  it('createSubscriptionCheckoutSession calls Stripe with recurring price', async () => {
    const result = await service.createSubscriptionCheckoutSession({
      planId: 'plan-1',
      planSlug: 'all-access-monthly',
      planName: 'All Access',
      stripePriceId: 'price_test_monthly',
      userId: 'user-1',
      customerEmail: 'buyer@example.com',
    });

    expect(sessionsCreate).toHaveBeenCalledWith({
      mode: 'subscription',
      line_items: [{ quantity: 1, price: 'price_test_monthly' }],
      metadata: {
        planId: 'plan-1',
        planSlug: 'all-access-monthly',
        userId: 'user-1',
      },
      subscription_data: {
        metadata: {
          planId: 'plan-1',
          planSlug: 'all-access-monthly',
          userId: 'user-1',
        },
      },
      success_url:
        'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:
        'http://localhost:3000/subscriptions?plan=all-access-monthly&cancelled=1',
      customer_email: 'buyer@example.com',
    });
    expect(result).toEqual({
      sessionId: 'cs_test_session',
      url: 'https://checkout.stripe.com/pay/cs_test_session',
    });

    vi.unstubAllEnvs();
  });

  it('retrieveCheckoutSession retrieves session with payment_intent expanded', async () => {
    const session = await service.retrieveCheckoutSession('cs_test_session');

    expect(sessionsRetrieve).toHaveBeenCalledWith('cs_test_session', {
      expand: ['payment_intent'],
    });
    expect(session).toMatchObject({
      id: 'cs_test_session',
      payment_status: 'paid',
    });

    vi.unstubAllEnvs();
  });

  it('throws when secret key is missing', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');

    const fresh = new StripeService();
    expect(() => fresh.getClient()).toThrow('STRIPE_SECRET_KEY is missing or invalid');

    vi.unstubAllEnvs();
  });
});
