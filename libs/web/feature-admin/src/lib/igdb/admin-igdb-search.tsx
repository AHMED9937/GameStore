import { Button, Input } from '@gamestore/shared/ui';
import styles from './igdb.module.css';

export type AdminIgdbSearchProps = {
  query: string;
  searching?: boolean;
  disabled?: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
};

export function AdminIgdbSearch({
  query,
  searching = false,
  disabled = false,
  onQueryChange,
  onSearch,
}: AdminIgdbSearchProps) {
  const isDisabled = disabled || searching;

  return (
    <form
      className={styles.searchRow}
      data-testid="admin-igdb-search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <Input
        className={styles.searchInput}
        type="search"
        placeholder="Search IGDB titles…"
        value={query}
        disabled={isDisabled}
        aria-label="Search IGDB"
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <Button type="submit" disabled={isDisabled || query.trim().length === 0}>
        {searching ? 'Searching…' : 'Search'}
      </Button>
    </form>
  );
}
