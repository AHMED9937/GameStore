import { Container } from '@gamestore/shared/ui';
import { AdminPageShell } from '../components/admin-page-shell';
import { AdminDashboardHeader } from './admin-dashboard-header';
import { AdminDashboardQuickActions } from './admin-dashboard-quick-actions';
import { AdminDashboardRecentActivity } from './admin-dashboard-recent-activity';
import { AdminDashboardStatsGrid } from './admin-dashboard-stats-grid';

export function AdminDashboardPage() {
  return (
    <Container>
      <AdminPageShell>
        <AdminDashboardHeader />
        <AdminDashboardStatsGrid />
        <AdminDashboardQuickActions />
        <AdminDashboardRecentActivity />
      </AdminPageShell>
    </Container>
  );
}
