import { Heading } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import type { AdminAsyncState } from '../types/admin-async-state';
import styles from './dashboard.module.css';

export type AdminDashboardRecentActivityProps = {
  activityState: AdminAsyncState<null>;
};

export function AdminDashboardRecentActivity({
  activityState,
}: AdminDashboardRecentActivityProps) {
  return (
    <section className={styles.recentActivity} aria-labelledby="admin-recent-activity">
      <Heading level="h3" id="admin-recent-activity" style={{ marginBottom: '0.75rem' }}>
        Recent activity
      </Heading>
      <AdminAsyncView state={activityState}>{() => null}</AdminAsyncView>
    </section>
  );
}
