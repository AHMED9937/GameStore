import { Button, Text } from '@gamestore/shared/ui';
import type { AdminIgdbResultItem } from './admin-igdb.types';
import styles from './igdb.module.css';

export type AdminIgdbResultsGridProps = {
  results: AdminIgdbResultItem[];
};

export function AdminIgdbResultsGrid({ results }: AdminIgdbResultsGridProps) {
  if (results.length === 0) {
    return (
      <div data-testid="admin-igdb-results-empty">
        <Text tone="muted">Search results will appear here.</Text>
      </div>
    );
  }

  return (
    <div className={styles.resultsGrid} data-testid="admin-igdb-results-grid">
      {results.map((result) => (
        <article key={result.igdbId} className={styles.resultCard}>
          <div className={styles.resultCover} aria-hidden />
          <Text>{result.title}</Text>
          <Text tone="dim">{result.releaseDate ?? 'Release TBD'}</Text>
          <Button type="button" variant="secondary" disabled>
            Import
          </Button>
        </article>
      ))}
    </div>
  );
}
