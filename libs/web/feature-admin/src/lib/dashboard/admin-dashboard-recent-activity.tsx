import { Heading } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { ADMIN_DASHBOARD_SETUP_MESSAGE } from './dashboard.constants';
import styles from './dashboard.module.css';

export function AdminDashboardRecentActivity() {
  return (
    <section className={styles.recentActivity} aria-labelledby="admin-recent-activity">
      <Heading level="h3" id="admin-recent-activity" style={{ marginBottom: '0.75rem' }}>
        Recent activity
      </Heading>
      <AdminAsyncView
        state={{ status: 'setup', message: ADMIN_DASHBOARD_SETUP_MESSAGE }}
      >
        {() => null}
      </AdminAsyncView>
    </section>
  );
}
