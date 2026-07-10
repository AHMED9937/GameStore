import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { OrdersRepository } from '@gamestore/api/data-access';
import { AdminOrdersService } from './admin-orders.service';

describe('AdminOrdersService', () => {
  const orders = {
    findAll: vi.fn().mockResolvedValue([
      {
        id: 'order-1',
        status: 'completed',
        orderType: 'one_time',
        amount: { toString: () => '19.99' },
        currency: 'USD',
        buyerEmail: 'buyer@example.com',
        owner: { email: 'owner@example.com' },
        game: { title: 'Demo Game', slug: 'demo-game' },
        license: { licenseKey: 'GS-ABCD-EF12', source: 'purchase' },
        createdAt: new Date('2025-06-30T12:00:00.000Z'),
      },
      {
        id: 'order-2',
        status: 'pending',
        orderType: 'one_time',
        amount: { toString: () => '9.99' },
        currency: 'USD',
        buyerEmail: null,
        owner: null,
        game: { title: 'Other Game', slug: 'other-game' },
        license: null,
        createdAt: new Date('2025-06-29T12:00:00.000Z'),
      },
    ]),
    findById: vi.fn(),
    deleteById: vi.fn(),
  } as unknown as OrdersRepository;

  const service = new AdminOrdersService(orders);

  beforeEach(() => {
    vi.mocked(orders.findById).mockReset();
    vi.mocked(orders.deleteById).mockReset();
  });

  it('maps orders with masked license keys and entitlement metadata', async () => {
    const result = await service.findAll();

    expect(result).toEqual([
      {
        id: 'order-1',
        status: 'completed',
        orderType: 'one_time',
        amount: '19.99',
        currency: 'USD',
        buyerEmail: 'buyer@example.com',
        ownerEmail: 'owner@example.com',
        gameTitle: 'Demo Game',
        gameSlug: 'demo-game',
        licenseKeyMasked: 'GS-****-EF12',
        licenseSource: 'purchase',
        createdAt: '2025-06-30T12:00:00.000Z',
      },
      {
        id: 'order-2',
        status: 'pending',
        orderType: 'one_time',
        amount: '9.99',
        currency: 'USD',
        buyerEmail: null,
        ownerEmail: null,
        gameTitle: 'Other Game',
        gameSlug: 'other-game',
        licenseKeyMasked: null,
        licenseSource: null,
        createdAt: '2025-06-29T12:00:00.000Z',
      },
    ]);
  });

  it('bulkDelete deletes pending and failed orders only', async () => {
    vi.mocked(orders.findById)
      .mockResolvedValueOnce({ id: 'o1', status: 'pending' } as never)
      .mockResolvedValueOnce({ id: 'o2', status: 'failed' } as never);

    await expect(service.bulkDelete(['o1', 'o2'])).resolves.toEqual({
      succeeded: ['o1', 'o2'],
      failed: [],
    });
    expect(orders.deleteById).toHaveBeenCalledTimes(2);
  });

  it('bulkDelete rejects completed orders', async () => {
    vi.mocked(orders.findById).mockResolvedValue({
      id: 'o1',
      status: 'completed',
    } as never);

    const result = await service.bulkDelete(['o1']);

    expect(result.succeeded).toEqual([]);
    expect(result.failed[0]?.reason).toContain('Cannot delete completed order');
    expect(orders.deleteById).not.toHaveBeenCalled();
  });

  it('maps orders using snapshots when game relation is missing', async () => {
    vi.mocked(orders.findAll).mockResolvedValueOnce([
      {
        id: 'order-1',
        status: 'completed',
        orderType: 'one_time',
        amount: { toString: () => '19.99' },
        currency: 'USD',
        buyerEmail: 'buyer@example.com',
        owner: null,
        game: null,
        gameTitleSnapshot: 'Archived Game',
        gameSlugSnapshot: 'archived-game',
        license: null,
        createdAt: new Date('2025-06-30T12:00:00.000Z'),
      },
    ] as never);

    const result = await service.findAll();

    expect(result[0]?.gameTitle).toBe('Archived Game');
    expect(result[0]?.gameSlug).toBe('archived-game');
  });
});
