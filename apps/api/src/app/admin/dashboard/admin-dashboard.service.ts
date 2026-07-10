import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from '@gamestore/api/data-access';
import { PrismaService } from '@gamestore/api/prisma';

export type AdminDashboardActivityItemDto = {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export type AdminDashboardStatsDto = {
  publishedGames: number;
  activeLicenses: number;
  poolAccounts: number;
  ordersToday: number;
  recentActivity: AdminDashboardActivityItemDto[];
};

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsRepository,
  ) {}

  async getStats(): Promise<AdminDashboardStatsDto> {
    const ordersTodayStart = startOfUtcDay();

    const [publishedGames, activeLicenses, poolAccounts, ordersToday] =
      await this.prisma.$transaction([
        this.prisma.game.count({ where: { publishedAt: { not: null } } }),
        this.prisma.license.count({ where: { status: 'activated' } }),
        this.prisma.gameAccount.count({ where: { isActive: true } }),
        this.prisma.order.count({
          where: { createdAt: { gte: ordersTodayStart } },
        }),
      ]);

    const activityPage = await this.auditLogs.findPaginated({
      page: 1,
      limit: 10,
    });

    return {
      publishedGames,
      activeLicenses,
      poolAccounts,
      ordersToday,
      recentActivity: activityPage.items.map((item) => ({
        id: item.id,
        action: item.action,
        resource: item.resource,
        resourceId: item.resourceId,
        actorEmail: item.user?.email ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
