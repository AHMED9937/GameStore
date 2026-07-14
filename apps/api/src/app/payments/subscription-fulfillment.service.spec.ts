import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  GameAccountsRepository,
  SubscriptionPlansRepository,
  UserSubscriptionsRepository,
} from '@gamestore/api/data-access';
import type { PrismaService } from '@gamestore/api/prisma';
import type { StripeService } from '@gamestore/api/stripe';
import { SubscriptionFulfillmentService } from './subscription-fulfillment.service';

const periodStart = Math.floor(Date.now() / 1000);
const periodEnd = periodStart + 30 * 24 * 60 * 60;

const stripeSubscription = {
  id: 'sub_stripe_123',
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
} as import('stripe').default.Subscription;

describe('SubscriptionFulfillmentService', () => {
  const tx = {
    license: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'lic-1' }),
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };

  const prisma = {
    license: {
      upsert: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  } as unknown as PrismaService;

  const plans = {
    findById: vi.fn(),
  } as unknown as SubscriptionPlansRepository;

  const userSubscriptions = {
    findByStripeSubscriptionId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as UserSubscriptionsRepository;

  const gameAccounts = {
    claimSeatForGame: vi.fn().mockResolvedValue({ id: 'acct-1' }),
    advanceNextAccountIfFull: vi.fn().mockResolvedValue('acct-1'),
  } as unknown as GameAccountsRepository;

  const stripe = {
    retrieveSubscription: vi.fn(),
  } as unknown as StripeService;

  let service: SubscriptionFulfillmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SubscriptionFulfillmentService(
      prisma,
      plans,
      userSubscriptions,
      gameAccounts,
      stripe,
    );

    vi.mocked(plans.findById).mockResolvedValue({
      id: 'plan-1',
      slug: 'all-access-monthly',
      isActive: true,
      games: [{ gameId: 'game-1', planId: 'plan-1' }],
    } as never);
    vi.mocked(userSubscriptions.findByStripeSubscriptionId).mockResolvedValue(null);
    vi.mocked(userSubscriptions.create).mockResolvedValue({ id: 'user-sub-1' } as never);
    vi.mocked(stripe.retrieveSubscription).mockResolvedValue(stripeSubscription);
    vi.mocked(gameAccounts.claimSeatForGame).mockResolvedValue({ id: 'acct-1' } as never);
    tx.license.findUnique.mockResolvedValue(null);
    tx.license.create.mockResolvedValue({ id: 'lic-1' });
  });

  it('fulfills a paid subscription checkout session', async () => {
    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_sub_test',
      mode: 'subscription',
      payment_status: 'paid',
      subscription: 'sub_stripe_123',
      metadata: { planId: 'plan-1', userId: 'user-1' },
      customer_details: { email: 'buyer@example.com' },
    } as never);

    expect(result).toEqual({
      action: 'subscription_fulfilled',
      subscriptionId: 'user-sub-1',
      licenseIds: ['lic-1'],
    });
    expect(gameAccounts.claimSeatForGame).toHaveBeenCalled();
    expect(tx.license.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'subscription',
          account: { connect: { id: 'acct-1' } },
        }),
      }),
    );
  });

  it('renews subscription licenses on invoice.paid', async () => {
    vi.mocked(userSubscriptions.findByStripeSubscriptionId).mockResolvedValue({
      id: 'user-sub-1',
      licenses: [{ id: 'lic-1' }],
    } as never);
    vi.mocked(prisma.license.findMany).mockResolvedValue([{ id: 'lic-1' }]);

    const result = await service.handleInvoicePaid({
      id: 'in_test',
      subscription: 'sub_stripe_123',
    } as Stripe.Invoice);

    expect(result.action).toBe('subscription_renewed');
    expect(prisma.license.updateMany).toHaveBeenCalled();
  });
});
