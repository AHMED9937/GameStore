import { Button, Text } from '@gamestore/shared/ui';
import styles from './audit.module.css';

export function AdminAuditPagination() {
  return (
    <div className={styles.pagination} data-testid="admin-audit-pagination">
      <Text tone="muted">Page 1 of —</Text>
      <div className={styles.paginationActions}>
        <Button type="button" variant="secondary" disabled>
          Previous
        </Button>
        <Button type="button" variant="secondary" disabled>
          Next
        </Button>
      </div>
    </div>
  );
}
