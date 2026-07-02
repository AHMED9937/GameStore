import { describe, expect, it, vi } from 'vitest';
import { AdminOrdersService } from './admin-orders.service';

describe('AdminOrdersService', () => {
  it('maps orders with masked license keys and entitlement metadata', async () => {
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
    };

    const service = new AdminOrdersService(orders as never);
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
});
