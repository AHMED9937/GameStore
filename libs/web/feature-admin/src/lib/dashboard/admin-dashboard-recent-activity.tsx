import Link from 'next/link';
import { Button, Heading } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import {
  DASHBOARD_ACTIVITY_COLUMNS,
  formatDashboardActivityTime,
} from './dashboard.constants';
import type { AdminDashboardActivityItem } from './dashboard.types';
import styles from './dashboard.module.css';

export type AdminDashboardRecentActivityProps = {
  activity: AdminDashboardActivityItem[];
};

export function AdminDashboardRecentActivity({
  activity,
}: AdminDashboardRecentActivityProps) {
  return (
    <section className={styles.recentActivity} aria-labelledby="admin-recent-activity">
      <div className={styles.recentActivityHeader}>
        <Heading level="h3" id="admin-recent-activity">
          Recent activity
        </Heading>
        <Link href="/admin/audit">
          <Button type="button" variant="secondary">
            View full audit log
          </Button>
        </Link>
      </div>

      {activity.length === 0 ? (
        <p className={styles.recentActivityEmpty} data-testid="admin-dashboard-activity-empty">
          No recent activity.
        </p>
      ) : (
        <div data-testid="admin-dashboard-activity-table">
          <AdminTable
            columns={[...DASHBOARD_ACTIVITY_COLUMNS]}
            caption="Recent admin activity"
          >
            {activity.map((item) => (
              <tr key={item.id}>
                <td>{formatDashboardActivityTime(item.createdAt)}</td>
                <td>{item.actorEmail ?? '—'}</td>
                <td>{item.action}</td>
                <td>{item.resource ?? '—'}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      )}
    </section>
  );
}
