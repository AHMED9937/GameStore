import { describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { AdminSubscriptionPlansController } from './admin-subscription-plans.controller';
import type { AdminSubscriptionPlansService } from './admin-subscription-plans.service';

const samplePlan = {
  id: 'plan-1',
  name: 'All Access',
  slug: 'all-access-monthly',
  stripePriceId: 'price_test_monthly',
  interval: 'month',
  intervalCount: 1,
  isActive: true,
  games: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminSubscriptionPlansController', () => {
  const plans = {
    findAll: vi.fn().mockResolvedValue([
      {
        id: 'plan-1',
        name: 'All Access',
        slug: 'all-access-monthly',
        stripePriceId: 'price_test_monthly',
        interval: 'month',
        intervalCount: 1,
        isActive: true,
        gameCount: 0,
      },
    ]),
    findOne: vi.fn().mockResolvedValue(samplePlan),
    create: vi.fn().mockResolvedValue(samplePlan),
    update: vi.fn().mockResolvedValue(samplePlan),
    remove: vi.fn().mockResolvedValue({ id: 'plan-1', deleted: true }),
    bulkDelete: vi.fn().mockResolvedValue({ succeeded: ['plan-1'], failed: [] }),
  } satisfies Pick<
    AdminSubscriptionPlansService,
    'findAll' | 'findOne' | 'create' | 'update' | 'remove' | 'bulkDelete'
  >;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditLogService;

  const controller = new AdminSubscriptionPlansController(
    plans as unknown as AdminSubscriptionPlansService,
    auditLogService,
  );

  const user = {
    id: 'admin-1',
    clerkId: 'clerk-admin',
    email: 'admin@example.com',
    role: 'admin' as const,
  };

  const request = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'vitest' },
  } as never;

  it('GET findAll returns subscription plans', async () => {
    await expect(controller.findAll()).resolves.toEqual([
      expect.objectContaining({ slug: 'all-access-monthly' }),
    ]);
  });

  it('POST create records audit metadata', async () => {
    const result = await controller.create(
      {
        name: 'All Access',
        stripePriceId: 'price_test_monthly',
        interval: 'month',
      },
      user,
      request,
    );

    expect(result).toEqual(samplePlan);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.subscription_plan.create',
        resourceId: 'plan-1',
      }),
    );
  });

  it('DELETE remove records audit metadata', async () => {
    await expect(
      controller.remove('plan-1', user, request),
    ).resolves.toEqual({ id: 'plan-1', deleted: true });
  });

  it('bulkDelete records bulk audit metadata', async () => {
    await controller.bulkDelete({ ids: ['plan-1', 'plan-2'] }, user, request);
    expect(plans.bulkDelete).toHaveBeenCalledWith(['plan-1', 'plan-2']);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.subscription_plan.bulk_delete',
      }),
    );
  });
});
