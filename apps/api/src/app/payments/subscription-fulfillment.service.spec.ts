import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import type {
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
} as Stripe.Subscription;

describe('SubscriptionFulfillmentService', () => {
  const prisma = {
    license: {
      upsert: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  } as unknown as PrismaService;

  const plans = {
    findById: vi.fn(),
  } as unknown as SubscriptionPlansRepository;

  const userSubscriptions = {
    findByStripeSubscriptionId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as UserSubscriptionsRepository;

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
    vi.mocked(prisma.license.upsert).mockResolvedValue({ id: 'lic-1' } as never);
  });

  it('fulfills a paid subscription checkout session', async () => {
    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_sub_test',
      mode: 'subscription',
      payment_status: 'paid',
      subscription: 'sub_stripe_123',
      metadata: { planId: 'plan-1', userId: 'user-1' },
      customer_details: { email: 'buyer@example.com' },
    } as Stripe.Checkout.Session);

    expect(result).toEqual({
      action: 'subscription_fulfilled',
      subscriptionId: 'user-sub-1',
      licenseIds: ['lic-1'],
    });
    expect(prisma.license.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          source: 'subscription',
          expiresAt: expect.any(Date),
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
