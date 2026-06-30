import { Input } from '@gamestore/shared/ui';
import styles from './games.module.css';

export function AdminGamesToolbar() {
  return (
    <div className={styles.toolbar} data-testid="admin-games-toolbar">
      <Input
        className={styles.search}
        type="search"
        placeholder="Search games…"
        disabled
        aria-label="Search games"
      />
    </div>
  );
}
