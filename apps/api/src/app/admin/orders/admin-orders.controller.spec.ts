import { describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { AdminOrdersController } from './admin-orders.controller';
import type { AdminOrdersService } from './admin-orders.service';

describe('AdminOrdersController', () => {
  const adminOrders = {
    findAll: vi.fn().mockResolvedValue([
      {
        id: 'order-1',
        status: 'completed',
        orderType: 'one_time',
        amount: '19.99',
        currency: 'USD',
        buyerEmail: 'buyer@example.com',
        ownerEmail: null,
        gameTitle: 'Demo Game',
        gameSlug: 'demo-game',
        licenseKeyMasked: 'GS-****-ABCD',
        licenseSource: 'purchase',
        createdAt: '2025-06-30T12:00:00.000Z',
      },
    ]),
    bulkDelete: vi.fn().mockResolvedValue({ succeeded: ['order-2'], failed: [] }),
  } satisfies Pick<AdminOrdersService, 'findAll' | 'bulkDelete'>;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } satisfies AuditLogService;

  const controller = new AdminOrdersController(
    adminOrders as AdminOrdersService,
    auditLogService,
  );
  const adminUser = { id: 'admin-1', clerkId: 'clerk-admin', role: 'admin' as const };
  const request = { headers: {}, ip: '127.0.0.1' };

  it('findAll returns mapped admin order list', async () => {
    await expect(controller.findAll()).resolves.toEqual([
      {
        id: 'order-1',
        status: 'completed',
        orderType: 'one_time',
        amount: '19.99',
        currency: 'USD',
        buyerEmail: 'buyer@example.com',
        ownerEmail: null,
        gameTitle: 'Demo Game',
        gameSlug: 'demo-game',
        licenseKeyMasked: 'GS-****-ABCD',
        licenseSource: 'purchase',
        createdAt: '2025-06-30T12:00:00.000Z',
      },
    ]);
  });

  it('bulkDelete records audit log', async () => {
    await controller.bulkDelete(
      { ids: ['order-2'] },
      adminUser,
      request as never,
    );
    expect(adminOrders.bulkDelete).toHaveBeenCalledWith(['order-2']);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.order.bulk_delete',
      }),
    );
  });
});
