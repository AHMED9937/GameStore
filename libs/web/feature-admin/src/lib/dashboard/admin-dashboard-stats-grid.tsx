import { Card, Heading, Text } from '@gamestore/shared/ui';
import { DASHBOARD_STATS } from './dashboard.constants';
import styles from './dashboard.module.css';

export function AdminDashboardStatsGrid() {
  return (
    <div className={styles.dashboardStatsGrid}>
      {DASHBOARD_STATS.map(({ label, value }) => (
        <Card key={label} className={styles.statCard}>
          <Text tone="dim" className={styles.statLabel}>
            {label}
          </Text>
          <Heading level="h3">{value}</Heading>
        </Card>
      ))}
    </div>
  );
}
