import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrdersRepository } from '@gamestore/api/data-access';
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

  const prisma = {
    license: {
      create: vi.fn(),
    },
  } as unknown as PrismaService;

  let service: PaymentFulfillmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentFulfillmentService(prisma, orders);
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue(
      pendingOrder as never,
    );
    vi.mocked(prisma.license.create).mockResolvedValue({
      id: 'lic-1',
      licenseKey: 'GS-ABCD-EF01-2345',
    } as never);
    vi.mocked(orders.markCompleted).mockResolvedValue({
      id: 'order-1',
      status: 'completed',
    } as never);
  });

  it('fulfills a paid checkout session with a new license', async () => {
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
    expect(orders.markCompleted).toHaveBeenCalledWith('order-1', {
      licenseId: 'lic-1',
      stripePaymentId: 'pi_test',
      buyerEmail: 'buyer@example.com',
      amount: 19.99,
      ownerId: 'user-1',
    });
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
