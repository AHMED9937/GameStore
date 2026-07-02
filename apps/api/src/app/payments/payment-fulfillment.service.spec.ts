import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  GameAccountsRepository,
  OrdersRepository,
} from '@gamestore/api/data-access';
import type { PrismaService } from '@gamestore/api/prisma';
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

  const prisma = {
    license: {
      create: vi.fn(),
    },
  } as unknown as PrismaService;

  let service: PaymentFulfillmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentFulfillmentService(prisma, orders, gameAccounts);
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue(
      pendingOrder as never,
    );
    vi.mocked(gameAccounts.findAvailableForGame).mockResolvedValue({
      id: 'acct-1',
    } as never);
    vi.mocked(prisma.license.create).mockResolvedValue({
      id: 'lic-1',
      licenseKey: 'GS-ABCD-EF01-2345',
    } as never);
    vi.mocked(orders.markCompleted).mockResolvedValue({
      id: 'order-1',
      status: 'completed',
    } as never);
  });

  it('fulfills a paid checkout session with a purchase license', async () => {
    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_test_abc',
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
    expect(prisma.license.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        licenseKey: expect.stringMatching(/^GS-/),
        status: 'available',
        source: 'purchase',
        expiresAt: null,
        buyerEmail: 'buyer@example.com',
        validFrom: expect.any(Date),
        game: { connect: { id: 'game-1' } },
        owner: { connect: { id: 'user-1' } },
      }),
    });
    expect(orders.markCompleted).toHaveBeenCalledWith('order-1', {
      licenseId: 'lic-1',
      stripePaymentId: 'pi_test',
      buyerEmail: 'buyer@example.com',
      amount: 19.99,
      ownerId: 'user-1',
    });
  });

  it('still fulfills when no pool account is available', async () => {
    vi.mocked(gameAccounts.findAvailableForGame).mockResolvedValue(null);

    const warnSpy = vi.spyOn(service['logger'], 'warn');

    const result = await service.handleCheckoutSessionCompleted({
      id: 'cs_test_abc',
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
      payment_status: 'paid',
    } as never);

    expect(result).toEqual({
      action: 'already_fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-existing',
    });
    expect(prisma.license.create).not.toHaveBeenCalled();
    expect(gameAccounts.findAvailableForGame).not.toHaveBeenCalled();
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
