import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  GameAccountsRepository,
  SubscriptionPlansRepository,
  UserSubscriptionsRepository,
} from '@gamestore/api/data-access';
import type { PrismaService } from '@gamestore/api/prisma';
import type { PaddleService } from '@gamestore/api/paddle';
import { SubscriptionFulfillmentService } from './subscription-fulfillment.service';

const periodStart = new Date().toISOString();
const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const paddleSubscription = {
  id: 'sub_paddle_123',
  status: 'active',
  customerId: 'cus_paddle_123',
  currentBillingPeriod: {
    startsAt: periodStart,
    endsAt: periodEnd,
  },
  customData: {
    planId: 'plan-1',
    userId: 'user-1',
    customerEmail: 'buyer@example.com',
  },
};

function buildPaddleTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn_sub_test',
    status: 'completed',
    subscriptionId: 'sub_paddle_123',
    ...overrides,
  };
}

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
    findByProviderSubscriptionId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as UserSubscriptionsRepository;

  const gameAccounts = {
    claimSeatForGame: vi.fn().mockResolvedValue({ id: 'acct-1' }),
    advanceNextAccountIfFull: vi.fn().mockResolvedValue('acct-1'),
  } as unknown as GameAccountsRepository;

  const paddle = {
    retrieveSubscription: vi.fn(),
  } as unknown as PaddleService;

  let service: SubscriptionFulfillmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SubscriptionFulfillmentService(
      prisma,
      plans,
      userSubscriptions,
      gameAccounts,
      paddle,
    );

    vi.mocked(plans.findById).mockResolvedValue({
      id: 'plan-1',
      slug: 'all-access-monthly',
      isActive: true,
      games: [{ gameId: 'game-1', planId: 'plan-1' }],
    } as never);
    vi.mocked(userSubscriptions.findByProviderSubscriptionId).mockResolvedValue(null);
    vi.mocked(userSubscriptions.create).mockResolvedValue({ id: 'user-sub-1' } as never);
    vi.mocked(paddle.retrieveSubscription).mockResolvedValue(paddleSubscription as never);
    vi.mocked(gameAccounts.claimSeatForGame).mockResolvedValue({ id: 'acct-1' } as never);
    tx.license.findUnique.mockResolvedValue(null);
    tx.license.create.mockResolvedValue({ id: 'lic-1' });
  });

  it('fulfills a paid subscription checkout session', async () => {
    const result = await service.handleSubscriptionActivated(paddleSubscription as never);

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

  it('renews subscription licenses on transaction.completed for a subscription', async () => {
    vi.mocked(userSubscriptions.findByProviderSubscriptionId).mockResolvedValue({
      id: 'user-sub-1',
      licenses: [{ id: 'lic-1' }],
    } as never);
    vi.mocked(prisma.license.findMany).mockResolvedValue([{ id: 'lic-1' }]);

    const result = await service.handleTransactionCompletedForSubscription(
      buildPaddleTransaction() as never,
    );

    expect(paddle.retrieveSubscription).toHaveBeenCalledWith('sub_paddle_123');
    expect(result.action).toBe('subscription_synced');
    expect(prisma.license.updateMany).toHaveBeenCalled();
  });
});
