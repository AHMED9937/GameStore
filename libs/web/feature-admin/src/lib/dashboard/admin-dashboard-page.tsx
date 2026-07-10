'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminStats } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminDashboardHeader } from './admin-dashboard-header';
import { AdminDashboardQuickActions } from './admin-dashboard-quick-actions';
import { AdminDashboardRecentActivity } from './admin-dashboard-recent-activity';
import { AdminDashboardStatsGrid } from './admin-dashboard-stats-grid';
import type { AdminDashboardStats } from './dashboard.types';

export type AdminDashboardPageProps = {
  statsState?: AdminAsyncState<AdminDashboardStats>;
};

function parseDashboardStats(data: unknown): AdminDashboardStats {
  const stats = data as AdminDashboardStats;
  return {
    publishedGames: stats.publishedGames ?? 0,
    activeLicenses: stats.activeLicenses ?? 0,
    poolAccounts: stats.poolAccounts ?? 0,
    ordersToday: stats.ordersToday ?? 0,
    recentActivity: Array.isArray(stats.recentActivity) ? stats.recentActivity : [],
  };
}

export function AdminDashboardPage({ statsState }: AdminDashboardPageProps) {
  const { state: fetchedState, refetch, isRefetching } = useAdminResourceState(
    () => getAdminStats(),
    parseDashboardStats,
  );
  const state = statsState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminDashboardHeader />
        <AdminAsyncView
          state={state}
          onRetry={statsState ? undefined : refetch}
          isRetrying={isRefetching}
        >
          {(stats) => (
            <>
              <AdminDashboardStatsGrid stats={stats} />
              <AdminDashboardQuickActions />
              <AdminDashboardRecentActivity activity={stats.recentActivity} />
            </>
          )}
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
