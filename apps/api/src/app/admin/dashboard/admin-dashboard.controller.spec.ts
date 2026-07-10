import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDashboardController } from './admin-dashboard.controller';
import type { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardController', () => {
  const dashboard = {
    getStats: vi.fn(),
  } as unknown as AdminDashboardService;

  let controller: AdminDashboardController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AdminDashboardController(dashboard);
  });

  it('getStats delegates to AdminDashboardService', async () => {
    const stats = {
      publishedGames: 2,
      activeLicenses: 5,
      poolAccounts: 1,
      ordersToday: 0,
      recentActivity: [],
    };
    vi.mocked(dashboard.getStats).mockResolvedValue(stats);

    await expect(controller.getStats()).resolves.toEqual(stats);
    expect(dashboard.getStats).toHaveBeenCalledTimes(1);
  });
});
