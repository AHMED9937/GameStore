import { Input } from '@gamestore/shared/ui';
import styles from './licenses.module.css';

export type AdminLicensesFiltersProps = {
  gameQuery: string;
  statusQuery: string;
  disabled?: boolean;
  onGameQueryChange: (value: string) => void;
  onStatusQueryChange: (value: string) => void;
};

export function AdminLicensesFilters({
  gameQuery,
  statusQuery,
  disabled = false,
  onGameQueryChange,
  onStatusQueryChange,
}: AdminLicensesFiltersProps) {
  return (
    <div className={styles.filters} data-testid="admin-licenses-filters">
      <Input
        className={styles.filterField}
        type="search"
        placeholder="Filter by game…"
        value={gameQuery}
        disabled={disabled}
        aria-label="Filter licenses by game"
        onChange={(event) => onGameQueryChange(event.target.value)}
      />
      <Input
        className={styles.filterField}
        type="search"
        placeholder="Filter by status…"
        value={statusQuery}
        disabled={disabled}
        aria-label="Filter licenses by status"
        onChange={(event) => onStatusQueryChange(event.target.value)}
      />
    </div>
  );
}
