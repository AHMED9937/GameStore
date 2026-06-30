import { Input } from '@gamestore/shared/ui';
import styles from './audit.module.css';

export function AdminAuditFilters() {
  return (
    <div className={styles.filters} data-testid="admin-audit-filters">
      <Input
        className={styles.filterField}
        type="search"
        placeholder="Filter by action…"
        disabled
        aria-label="Filter audit log by action"
      />
    </div>
  );
}
