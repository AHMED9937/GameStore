import { Button, Input } from '@gamestore/shared/ui';
import styles from './igdb.module.css';

export function AdminIgdbSearch() {
  return (
    <div className={styles.searchRow} data-testid="admin-igdb-search">
      <Input
        className={styles.searchInput}
        type="search"
        placeholder="Search IGDB titles…"
        disabled
        aria-label="Search IGDB"
      />
      <Button type="button" disabled>
        Search
      </Button>
    </div>
  );
}
