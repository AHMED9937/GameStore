import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  GameAccountsRepository,
  OrdersRepository,
} from '@gamestore/api/data-access';
import type { PrismaService } from '@gamestore/api/prisma';
import type { StripeService } from '@gamestore/api/stripe';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

const pendingOrder = {
  id: 'order-1',
  gameId: 'game-1',
  status: 'pending',
  ownerId: 'user-1',
  license: null,
};

describe('PaymentFulfillmentService', () => {
  const orders = {
    findByStripeSessionId: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  } as unknown as OrdersRepository;

  const gameAccounts = {
    findAvailableForGame: vi.fn(),
  } as unknown as GameAccountsRepository;

  const tx = {
    license: {
      create: vi.fn(),
    },
    order: {
      update: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  } as unknown as PrismaService;

  const stripe = {
    retrieveCheckoutSession: vi.fn(),
  } as unknown as StripeService;

  let service: PaymentFulfillmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentFulfillmentService(
      prisma,
      orders,
      gameAccounts,
      stripe,
    );
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue(
      pendingOrder as never,
    );
    vi.mocked(gameAccounts.findAvailableForGame).mockResolvedValue({
      id: 'acct-1',
    } as never);
    tx.license.create.mockResolvedValue({
      id: 'lic-1',
      licenseKey: 'GS-ABCD-EF01-2345',
    });
    tx.order.update.mockResolvedValue({
      id: 'order-1',
      status: 'completed',
    });
  });

  it('fulfills a paid checkout session with a purchase license', async () => {
    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_test_abc',
      mode: 'payment',
      payment_status: 'paid',
      metadata: { gameId: 'game-1', userId: 'user-1' },
      amount_total: 1999,
      payment_intent: 'pi_test',
      customer_details: { email: 'buyer@example.com' },
    } as never);

    expect(result).toEqual({
      action: 'fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-1',
    });
    expect(gameAccounts.findAvailableForGame).toHaveBeenCalledWith('game-1');
    expect(tx.license.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        licenseKey: expect.stringMatching(/^GS-/),
        status: 'available',
        source: 'purchase',
        expiresAt: expect.any(Date),
        buyerEmail: 'buyer@example.com',
        validFrom: expect.any(Date),
        game: { connect: { id: 'game-1' } },
        owner: { connect: { id: 'user-1' } },
      }),
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: expect.objectContaining({
        status: 'completed',
        licenseId: 'lic-1',
        stripePaymentId: 'pi_test',
        buyerEmail: 'buyer@example.com',
        amount: 19.99,
        ownerId: 'user-1',
      }),
    });
  });

  it('still fulfills when no pool account is available', async () => {
    vi.mocked(gameAccounts.findAvailableForGame).mockResolvedValue(null);

    const warnSpy = vi.spyOn(service['logger'], 'warn');

    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_test_abc',
      mode: 'payment',
      payment_status: 'paid',
      metadata: { gameId: 'game-1', userId: 'user-1' },
    } as never);

    expect(result.action).toBe('fulfilled');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No available pool account for game game-1'),
    );
  });

  it('is idempotent when the order is already completed', async () => {
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue({
      ...pendingOrder,
      status: 'completed',
      license: { id: 'lic-existing', licenseKey: 'GS-OLD', status: 'available' },
    } as never);

    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_test_abc',
      mode: 'payment',
      payment_status: 'paid',
    } as never);

    expect(result).toEqual({
      action: 'already_fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-existing',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(gameAccounts.findAvailableForGame).not.toHaveBeenCalled();
  });

  it('returns invalid_game when gameId cannot be resolved', async () => {
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue({
      ...pendingOrder,
      gameId: null,
    } as never);

    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_test_abc',
      mode: 'payment',
      payment_status: 'paid',
      metadata: {},
    } as never);

    expect(result).toEqual({
      action: 'invalid_game',
      orderId: 'order-1',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns pending_payment when Stripe session is unpaid', async () => {
    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_test_abc',
      mode: 'payment',
      payment_status: 'unpaid',
    } as never);

    expect(result).toEqual({ action: 'pending_payment' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('ignores subscription checkout sessions', async () => {
    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_test_sub',
      mode: 'subscription',
      payment_status: 'paid',
    } as never);

    expect(result).toEqual({ action: 'ignored' });
  });

  it('syncFulfillmentFromStripe delegates to handleCheckoutSessionCompleted when paid', async () => {
    vi.mocked(stripe.retrieveCheckoutSession).mockResolvedValue({
      id: 'cs_test_abc',
      mode: 'payment',
      status: 'complete',
      payment_status: 'paid',
      metadata: { gameId: 'game-1', userId: 'user-1' },
    } as never);

    const result = await service.syncFulfillmentFromStripe('cs_test_abc');

    expect(stripe.retrieveCheckoutSession).toHaveBeenCalledWith('cs_test_abc');
    expect(result.action).toBe('fulfilled');
  });

  it('syncFulfillmentFromStripe marks failed when Stripe session is expired', async () => {
    vi.mocked(stripe.retrieveCheckoutSession).mockResolvedValue({
      id: 'cs_test_abc',
      mode: 'payment',
      status: 'expired',
      payment_status: 'unpaid',
    } as never);

    const result = await service.syncFulfillmentFromStripe('cs_test_abc');

    expect(result).toEqual({
      action: 'marked_failed',
      orderId: 'order-1',
    });
    expect(orders.markFailed).toHaveBeenCalledWith('cs_test_abc');
  });

  it('cancelCheckoutSession marks unpaid checkout failed', async () => {
    vi.mocked(stripe.retrieveCheckoutSession).mockResolvedValue({
      id: 'cs_test_abc',
      mode: 'payment',
      status: 'open',
      payment_status: 'unpaid',
    } as never);

    const result = await service.cancelCheckoutSession('cs_test_abc');

    expect(result).toEqual({
      action: 'marked_failed',
      orderId: 'order-1',
    });
    expect(orders.markFailed).toHaveBeenCalledWith('cs_test_abc');
  });

  it('cancelCheckoutSession fulfills when payment already completed', async () => {
    vi.mocked(stripe.retrieveCheckoutSession).mockResolvedValue({
      id: 'cs_test_abc',
      mode: 'payment',
      status: 'complete',
      payment_status: 'paid',
      metadata: { gameId: 'game-1', userId: 'user-1' },
    } as never);

    const result = await service.cancelCheckoutSession('cs_test_abc');

    expect(result.action).toBe('fulfilled');
    expect(orders.markFailed).not.toHaveBeenCalled();
  });

  it('syncFulfillmentFromStripe returns ignored when Stripe retrieve fails', async () => {
    vi.mocked(stripe.retrieveCheckoutSession).mockRejectedValue(
      new Error('network error'),
    );

    const result = await service.syncFulfillmentFromStripe('cs_test_abc');

    expect(result).toEqual({ action: 'ignored' });
  });

  it('rolls back when order update fails inside transaction', async () => {
    tx.order.update.mockRejectedValue(new Error('update failed'));

    await expect(
      service.handleCheckoutSessionCompleted({
        id: 'cs_test_abc',
        mode: 'payment',
        payment_status: 'paid',
        metadata: { gameId: 'game-1', userId: 'user-1' },
      } as never),
    ).rejects.toThrow('update failed');
  });

  it('marks pending orders failed on session expiry', async () => {
    const result = await service.handleCheckoutSessionFailed('cs_test_abc');

    expect(result).toEqual({
      action: 'marked_failed',
      orderId: 'order-1',
    });
    expect(orders.markFailed).toHaveBeenCalledWith('cs_test_abc');
  });
});
