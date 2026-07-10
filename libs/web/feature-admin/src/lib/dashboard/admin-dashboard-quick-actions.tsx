import Link from 'next/link';
import { Button, Card, Heading } from '@gamestore/shared/ui';
import styles from './dashboard.module.css';

export function AdminDashboardQuickActions() {
  return (
    <Card className={styles.quickActionsCard}>
      <Heading level="h3" style={{ marginBottom: '0.75rem' }}>
        Quick links
      </Heading>
      <div className={styles.quickActionsGrid}>
        <Link href="/admin/games/new">
          <Button type="button">Add game</Button>
        </Link>
        <Link href="/admin/igdb">
          <Button type="button" variant="secondary">
            Import from IGDB
          </Button>
        </Link>
        <Link href="/admin/licenses/new">
          <Button type="button" variant="secondary">
            Create license
          </Button>
        </Link>
        <Link href="/admin/accounts/new">
          <Button type="button" variant="secondary">
            Add account
          </Button>
        </Link>
      </div>
    </Card>
  );
}
