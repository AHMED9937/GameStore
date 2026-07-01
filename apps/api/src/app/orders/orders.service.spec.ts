import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@gamestore/api/auth';
import type { OrdersRepository } from '@gamestore/api/data-access';
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
    findByStripeSessionId: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  } as unknown as OrdersRepository;

  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrdersService(orders);
  });

  it('createPending delegates to the repository', async () => {
    vi.mocked(orders.createPending).mockResolvedValue({
      id: 'order-1',
      status: 'pending',
    } as Awaited<ReturnType<OrdersRepository['createPending']>>);

    const result = await service.createPending({
      gameId: 'game-1',
      stripeSessionId: 'cs_test_abc',
      amount: 9.99,
    });

    expect(orders.createPending).toHaveBeenCalledWith({
      gameId: 'game-1',
      stripeSessionId: 'cs_test_abc',
      amount: 9.99,
    });
    expect(result).toMatchObject({ id: 'order-1', status: 'pending' });
  });

  it('findByStripeSessionId delegates to the repository', async () => {
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue(null);

    await service.findByStripeSessionId('cs_test_abc');

    expect(orders.findByStripeSessionId).toHaveBeenCalledWith('cs_test_abc');
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
    await service.markFailed('cs_test_abc');

    expect(orders.markFailed).toHaveBeenCalledWith('cs_test_abc');
  });

  it('getCheckoutBySession returns completed order with license', async () => {
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue({
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

    const result = await service.getCheckoutBySession('cs_test_abc', userA);

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

  it('getCheckoutBySession returns pending when webhook has not fulfilled', async () => {
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      ownerId: null,
    } as never);

    const result = await service.getCheckoutBySession('cs_test_abc');

    expect(result).toEqual({
      status: 'pending',
      message: 'Payment received — issuing your license…',
    });
  });

  it('getCheckoutBySession returns failed for failed orders', async () => {
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue({
      id: 'order-1',
      status: 'failed',
      ownerId: null,
    } as never);

    const result = await service.getCheckoutBySession('cs_test_abc');

    expect(result).toEqual({
      status: 'failed',
      message: 'Payment was not completed.',
    });
  });

  it('getCheckoutBySession enforces owner access', async () => {
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      ownerId: 'user-a',
    } as never);

    await expect(
      service.getCheckoutBySession('cs_test_abc', userB),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getCheckoutBySession returns 404 for unknown sessions', async () => {
    vi.mocked(orders.findByStripeSessionId).mockResolvedValue(null);

    await expect(
      service.getCheckoutBySession('cs_missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
