import { Input } from '@gamestore/shared/ui';
import styles from './licenses.module.css';

export function AdminLicensesFilters() {
  return (
    <div className={styles.filters} data-testid="admin-licenses-filters">
      <Input
        className={styles.filterField}
        type="search"
        placeholder="Filter by game…"
        disabled
        aria-label="Filter licenses by game"
      />
      <Input
        className={styles.filterField}
        type="search"
        placeholder="Filter by status…"
        disabled
        aria-label="Filter licenses by status"
      />
    </div>
  );
}
