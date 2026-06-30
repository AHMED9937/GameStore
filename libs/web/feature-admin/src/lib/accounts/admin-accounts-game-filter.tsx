import { Input } from '@gamestore/shared/ui';
import styles from './accounts.module.css';

export function AdminAccountsGameFilter() {
  return (
    <div className={styles.gameFilter} data-testid="admin-accounts-game-filter">
      <Input
        className={styles.filterField}
        type="search"
        placeholder="Filter by game…"
        disabled
        aria-label="Filter accounts by game"
      />
    </div>
  );
}
