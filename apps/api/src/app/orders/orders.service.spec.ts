import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@gamestore/api/auth';
import type { OrdersRepository } from '@gamestore/api/data-access';
import type { PaymentFulfillmentService } from '../payments/payment-fulfillment.service';
import { OrdersService } from './orders.service';

const userA: AuthUser = {
  id: 'user-a',
  clerkId: 'clerk-a',
  email: 'a@example.com',
  firstName: null,
  lastName: null,
  role: 'user',
};

const userB: AuthUser = {
  id: 'user-b',
  clerkId: 'clerk-b',
  email: 'b@example.com',
  firstName: null,
  lastName: null,
  role: 'user',
};

describe('OrdersService', () => {
  const orders = {
    createPending: vi.fn(),
    findByProviderCheckoutId: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  } as unknown as OrdersRepository;

  const fulfillment = {
    syncFulfillmentFromPaddle: vi.fn().mockResolvedValue({ action: 'ignored' }),
    cancelPaddleTransaction: vi.fn().mockResolvedValue({ action: 'ignored' }),
  } satisfies Pick<
    PaymentFulfillmentService,
    'syncFulfillmentFromPaddle' | 'cancelPaddleTransaction'
  >;

  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrdersService(
      orders,
      fulfillment as PaymentFulfillmentService,
    );
  });

  it('createPending delegates to the repository', async () => {
    vi.mocked(orders.createPending).mockResolvedValue({
      id: 'order-1',
      status: 'pending',
    } as Awaited<ReturnType<OrdersRepository['createPending']>>);

    const result = await service.createPending({
      gameId: 'game-1',
      providerCheckoutId: 'txn_test_abc',
      amount: 9.99,
    });

    expect(orders.createPending).toHaveBeenCalledWith({
      gameId: 'game-1',
      providerCheckoutId: 'txn_test_abc',
      amount: 9.99,
    });
    expect(result).toMatchObject({ id: 'order-1', status: 'pending' });
  });

  it('findByProviderCheckoutId delegates to the repository', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue(null);

    await service.findByProviderCheckoutId('txn_test_abc');

    expect(orders.findByProviderCheckoutId).toHaveBeenCalledWith('txn_test_abc');
  });

  it('findOne throws when the order is missing', async () => {
    vi.mocked(orders.findById).mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('markCompleted delegates to the repository', async () => {
    vi.mocked(orders.markCompleted).mockResolvedValue({
      id: 'order-1',
      status: 'completed',
    } as Awaited<ReturnType<OrdersRepository['markCompleted']>>);

    await service.markCompleted('order-1', { licenseId: 'lic-1' });

    expect(orders.markCompleted).toHaveBeenCalledWith('order-1', {
      licenseId: 'lic-1',
    });
  });

  it('markFailed delegates to the repository', async () => {
    await service.markFailed('txn_test_abc');

    expect(orders.markFailed).toHaveBeenCalledWith('txn_test_abc');
  });

  it('getCheckoutBySession returns completed order with license', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      id: 'order-1',
      status: 'completed',
      amount: { toString: () => '19.99' },
      currency: 'USD',
      buyerEmail: 'buyer@example.com',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      ownerId: 'user-a',
      game: { id: 'game-1', title: 'Demo Game', slug: 'demo-game-1' },
      license: {
        id: 'lic-1',
        licenseKey: 'GS-ABCD-EF01-2345',
        status: 'available',
      },
    } as never);

    const result = await service.getCheckoutBySession('txn_test_abc', userA);

    expect(result).toEqual({
      status: 'completed',
      order: {
        id: 'order-1',
        amount: '19.99',
        currency: 'USD',
        buyerEmail: 'buyer@example.com',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      license: {
        licenseKey: 'GS-ABCD-EF01-2345',
        status: 'available',
        game: { id: 'game-1', title: 'Demo Game', slug: 'demo-game-1' },
      },
    });
  });

  it('getCheckoutBySession syncs pending orders from Paddle before responding', async () => {
    vi.mocked(orders.findByProviderCheckoutId)
      .mockResolvedValueOnce({
        id: 'order-1',
        status: 'pending',
        ownerId: 'user-a',
      } as never)
      .mockResolvedValueOnce({
        id: 'order-1',
        status: 'completed',
        amount: { toString: () => '19.99' },
        currency: 'USD',
        buyerEmail: 'buyer@example.com',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        ownerId: 'user-a',
        game: { id: 'game-1', title: 'Demo Game', slug: 'demo-game-1' },
        license: {
          id: 'lic-1',
          licenseKey: 'GS-ABCD-EF01-2345',
          status: 'available',
        },
      } as never);
    vi.mocked(fulfillment.syncFulfillmentFromPaddle).mockResolvedValue({
      action: 'fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-1',
    });

    const result = await service.getCheckoutBySession('txn_test_abc', userA);

    expect(fulfillment.syncFulfillmentFromPaddle).toHaveBeenCalledWith(
      'txn_test_abc',
    );
    expect(result).toMatchObject({
      status: 'completed',
      license: {
        licenseKey: 'GS-ABCD-EF01-2345',
      },
    });
  });

  it('getCheckoutBySession returns pending when webhook has not fulfilled', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      ownerId: null,
    } as never);

    const result = await service.getCheckoutBySession('txn_test_abc');

    expect(fulfillment.syncFulfillmentFromPaddle).toHaveBeenCalledWith(
      'txn_test_abc',
    );
    expect(result).toEqual({
      status: 'pending',
      message: 'Payment received issuing your license…',
    });
  });

  it('getCheckoutBySession syncs pending orders without auth before access check', async () => {
    vi.mocked(orders.findByProviderCheckoutId)
      .mockResolvedValueOnce({
        id: 'order-1',
        status: 'pending',
        ownerId: 'user-a',
      } as never)
      .mockResolvedValueOnce({
        id: 'order-1',
        status: 'pending',
        ownerId: 'user-a',
      } as never);
    vi.mocked(fulfillment.syncFulfillmentFromPaddle).mockResolvedValue({
      action: 'pending_payment',
    });

    const result = await service.getCheckoutBySession('txn_test_abc');

    expect(fulfillment.syncFulfillmentFromPaddle).toHaveBeenCalledWith(
      'txn_test_abc',
    );
    expect(result).toEqual({
      status: 'pending',
      message: 'Confirming payment with Paddle…',
    });
  });

  it('getCheckoutBySession returns failed for failed orders', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      id: 'order-1',
      status: 'failed',
      ownerId: null,
    } as never);

    const result = await service.getCheckoutBySession('txn_test_abc');

    expect(result).toEqual({
      status: 'failed',
      message: 'Payment was not completed.',
    });
  });

  it('getCheckoutBySession enforces owner access for wrong signed-in user', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      ownerId: 'user-a',
    } as never);

    await expect(
      service.getCheckoutBySession('txn_test_abc', userB),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getCheckoutBySession returns completed order with license from snapshots', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      id: 'order-1',
      status: 'completed',
      amount: { toString: () => '19.99' },
      currency: 'USD',
      buyerEmail: 'buyer@example.com',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      ownerId: 'user-a',
      gameId: null,
      game: null,
      gameTitleSnapshot: 'Demo Game',
      gameSlugSnapshot: 'demo-game-1',
      license: {
        id: 'lic-1',
        licenseKey: 'GS-ABCD-EF01-2345',
        status: 'available',
      },
    } as never);

    const result = await service.getCheckoutBySession('txn_test_abc', userA);

    expect(result).toMatchObject({
      status: 'completed',
      license: {
        game: { id: '', title: 'Demo Game', slug: 'demo-game-1' },
      },
    });
  });

  it('getCheckoutBySession returns 404 for unknown sessions', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue(null);

    await expect(
      service.getCheckoutBySession('missing', userA),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cancelCheckoutBySession marks pending orders failed via fulfillment', async () => {
    vi.mocked(orders.findByProviderCheckoutId)
      .mockResolvedValueOnce({
        id: 'order-1',
        status: 'pending',
        ownerId: 'user-a',
      } as never)
      .mockResolvedValueOnce({
        id: 'order-1',
        status: 'failed',
        ownerId: 'user-a',
      } as never);

    const result = await service.cancelCheckoutBySession('txn_test_abc', userA);

    expect(fulfillment.cancelPaddleTransaction).toHaveBeenCalledWith('txn_test_abc');
    expect(result).toEqual({
      status: 'failed',
      message: 'Payment was not completed.',
    });
  });

  it('cancelCheckoutBySession skips fulfillment when order is already failed', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      id: 'order-1',
      status: 'failed',
      ownerId: 'user-a',
    } as never);

    const result = await service.cancelCheckoutBySession('txn_test_abc', userA);

    expect(fulfillment.cancelPaddleTransaction).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'failed',
      message: 'Payment was not completed.',
    });
  });

  it('cancelCheckoutBySession enforces owner access', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      ownerId: 'user-a',
    } as never);

    await expect(
      service.cancelCheckoutBySession('txn_test_abc', userB),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findAll delegates to the repository', async () => {
    vi.mocked(orders.findAll).mockResolvedValue([]);

    await service.findAll();

    expect(orders.findAll).toHaveBeenCalled();
  });
});
