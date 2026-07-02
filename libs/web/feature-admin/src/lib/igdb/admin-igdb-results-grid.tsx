import { Button, Text } from '@gamestore/shared/ui';
import type { AdminIgdbResultItem } from './admin-igdb.types';
import styles from './igdb.module.css';

export type AdminIgdbResultsGridProps = {
  results: AdminIgdbResultItem[];
  importingId?: number | null;
  disabled?: boolean;
  onImport: (igdbId: number) => void;
};

export function AdminIgdbResultsGrid({
  results,
  importingId = null,
  disabled = false,
  onImport,
}: AdminIgdbResultsGridProps) {
  if (results.length === 0) {
    return (
      <div data-testid="admin-igdb-results-empty">
        <Text tone="muted">Search results will appear here.</Text>
      </div>
    );
  }

  return (
    <div className={styles.resultsGrid} data-testid="admin-igdb-results-grid">
      {results.map((result) => {
        const isImporting = importingId === result.igdbId;

        return (
          <article key={result.igdbId} className={styles.resultCard}>
            {result.coverUrl ? (
              <img
                src={result.coverUrl}
                alt=""
                className={styles.resultCover}
                loading="lazy"
              />
            ) : (
              <div className={styles.resultCover} aria-hidden />
            )}
            <Text>{result.title}</Text>
            <Text tone="dim">{result.releaseDate ?? 'Release TBD'}</Text>
            <Button
              type="button"
              variant="secondary"
              disabled={disabled || isImporting}
              onClick={() => onImport(result.igdbId)}
            >
              {isImporting ? 'Importing…' : 'Import'}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
