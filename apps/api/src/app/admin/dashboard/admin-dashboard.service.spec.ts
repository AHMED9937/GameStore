import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLogsRepository } from '@gamestore/api/data-access';
import type { PrismaService } from '@gamestore/api/prisma';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  const gameCount = vi.fn().mockResolvedValue(3);
  const licenseCount = vi.fn().mockResolvedValue(7);
  const gameAccountCount = vi.fn().mockResolvedValue(2);
  const orderCount = vi.fn().mockResolvedValue(1);

  const prisma = {
    game: { count: gameCount },
    license: { count: licenseCount },
    gameAccount: { count: gameAccountCount },
    order: { count: orderCount },
    $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  } as unknown as PrismaService;

  const auditLogs = {
    findPaginated: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'log-1',
          action: 'game.publish',
          resource: 'game',
          resourceId: 'game-1',
          createdAt: new Date('2026-07-08T10:00:00.000Z'),
          user: { email: 'admin@example.com' },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    }),
  } as unknown as AuditLogsRepository;

  let service: AdminDashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminDashboardService(prisma, auditLogs);
  });

  it('returns aggregated stats and recent activity', async () => {
    const result = await service.getStats();

    expect(result).toEqual({
      publishedGames: 3,
      activeLicenses: 7,
      poolAccounts: 2,
      ordersToday: 1,
      recentActivity: [
        {
          id: 'log-1',
          action: 'game.publish',
          resource: 'game',
          resourceId: 'game-1',
          actorEmail: 'admin@example.com',
          createdAt: '2026-07-08T10:00:00.000Z',
        },
      ],
    });
  });

  it('queries counts with expected filters', async () => {
    await service.getStats();

    expect(gameCount).toHaveBeenCalledWith({
      where: { publishedAt: { not: null } },
    });
    expect(licenseCount).toHaveBeenCalledWith({
      where: { status: 'activated' },
    });
    expect(gameAccountCount).toHaveBeenCalledWith({
      where: { isActive: true },
    });
    expect(orderCount).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: expect.any(Date),
        },
      },
    });
    expect(auditLogs.findPaginated).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('uses start of UTC day for ordersToday', async () => {
    await service.getStats();

    const orderWhere = orderCount.mock.calls[0][0].where;
    const start = orderWhere.createdAt.gte as Date;
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);
    expect(start.getUTCSeconds()).toBe(0);
    expect(start.getUTCMilliseconds()).toBe(0);
  });

  it('maps activity without user email when absent', async () => {
    vi.mocked(auditLogs.findPaginated).mockResolvedValueOnce({
      items: [
        {
          id: 'log-2',
          action: 'license.create',
          resource: 'license',
          resourceId: 'lic-1',
          createdAt: new Date('2026-07-08T11:00:00.000Z'),
          user: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await service.getStats();

    expect(result.recentActivity[0].actorEmail).toBeNull();
  });
});
