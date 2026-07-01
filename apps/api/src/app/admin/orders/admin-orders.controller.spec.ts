import { describe, expect, it, vi } from 'vitest';
import { AdminOrdersController } from './admin-orders.controller';
import type { AdminOrdersService } from './admin-orders.service';

describe('AdminOrdersController', () => {
  it('findAll returns mapped admin order list', async () => {
    const adminOrders = {
      findAll: vi.fn().mockResolvedValue([
        {
          id: 'order-1',
          status: 'completed',
          amount: '19.99',
          currency: 'USD',
          buyerEmail: 'buyer@example.com',
          ownerEmail: null,
          gameTitle: 'Demo Game',
          gameSlug: 'demo-game',
          licenseKeyMasked: 'GS-****-ABCD',
          createdAt: '2025-06-30T12:00:00.000Z',
        },
      ]),
    } satisfies Pick<AdminOrdersService, 'findAll'>;

    const controller = new AdminOrdersController(
      adminOrders as AdminOrdersService,
    );

    await expect(controller.findAll()).resolves.toEqual([
      {
        id: 'order-1',
        status: 'completed',
        amount: '19.99',
        currency: 'USD',
        buyerEmail: 'buyer@example.com',
        ownerEmail: null,
        gameTitle: 'Demo Game',
        gameSlug: 'demo-game',
        licenseKeyMasked: 'GS-****-ABCD',
        createdAt: '2025-06-30T12:00:00.000Z',
      },
    ]);
  });
});
