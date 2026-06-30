'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminStats } from '@gamestore/web/data-access';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminSetupState } from '../hooks/use-admin-resource';
import { AdminDashboardHeader } from './admin-dashboard-header';
import { AdminDashboardQuickActions } from './admin-dashboard-quick-actions';
import { AdminDashboardRecentActivity } from './admin-dashboard-recent-activity';
import { AdminDashboardStatsGrid } from './admin-dashboard-stats-grid';
import type { AdminAsyncState } from '../types/admin-async-state';

export type AdminDashboardPageProps = {
  statsState?: AdminAsyncState<null>;
};

export function AdminDashboardPage({ statsState }: AdminDashboardPageProps) {
  const fetchedState = useAdminSetupState(() => getAdminStats());
  const activityState = statsState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminDashboardHeader />
        <AdminDashboardStatsGrid />
        <AdminDashboardQuickActions />
        <AdminDashboardRecentActivity activityState={activityState} />
      </AdminPageShell>
    </Container>
  );
}
