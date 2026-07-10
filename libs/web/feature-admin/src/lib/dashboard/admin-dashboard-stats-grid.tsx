import Link from 'next/link';
import { Card, Heading, Text } from '@gamestore/shared/ui';
import {
  DASHBOARD_STATS,
  formatDashboardStatValue,
} from './dashboard.constants';
import type { AdminDashboardStats } from './dashboard.types';
import styles from './dashboard.module.css';

export type AdminDashboardStatsGridProps = {
  stats: AdminDashboardStats;
};

export function AdminDashboardStatsGrid({ stats }: AdminDashboardStatsGridProps) {
  return (
    <div className={styles.dashboardStatsGrid} data-testid="admin-dashboard-stats">
      {DASHBOARD_STATS.map(({ key, label, href }) => (
        <Link key={key} href={href} className={styles.statCardLink}>
          <Card className={styles.statCard}>
            <Text tone="dim" className={styles.statLabel}>
              {label}
            </Text>
            <Heading level="h3">{formatDashboardStatValue(stats[key])}</Heading>
          </Card>
        </Link>
      ))}
    </div>
  );
}
