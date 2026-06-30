import { Card, Heading, Text } from '@gamestore/shared/ui';
import styles from './dashboard.module.css';

export function AdminDashboardQuickActions() {
  return (
    <Card className={styles.quickActionsCard}>
      <Heading level="h3" style={{ marginBottom: '0.5rem' }}>
        Quick links
      </Heading>
      <Text tone="muted">
        Use the sidebar to open Games, Licenses, Accounts, Orders, Audit, and IGDB.
        Live stats and activity feed connect in a later slice.
      </Text>
    </Card>
  );
}
