'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  importAdminIgdbGame,
  isSetupResponse,
  searchAdminIgdb,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import adminStyles from '../components/admin-components.module.css';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminMutation } from '../hooks/use-admin-mutation';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminIgdbHeader } from './admin-igdb-header';
import { AdminIgdbImportDialog } from './admin-igdb-import-dialog';
import { AdminIgdbResultsGrid } from './admin-igdb-results-grid';
import { AdminIgdbSearch } from './admin-igdb-search';
import type { AdminIgdbResultItem } from './admin-igdb.types';
import styles from './igdb.module.css';

export type AdminIgdbPageProps = {
  resultsState?: AdminAsyncState<AdminIgdbResultItem[]>;
};

function parseIgdbResults(data: unknown): AdminIgdbResultItem[] {
  return Array.isArray(data) ? (data as AdminIgdbResultItem[]) : [];
}

export function AdminIgdbPage({ resultsState }: AdminIgdbPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<AdminAsyncState<AdminIgdbResultItem[]>>({
    status: 'idle',
  });
  const [searchValidation, setSearchValidation] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [importTarget, setImportTarget] = useState<AdminIgdbResultItem | null>(null);
  const importMutation = useAdminMutation<{ game: { id: string }; updated?: boolean }>();

  const resolvedState = resultsState ?? state;
  const isControlled = resultsState !== undefined;
  const isSetup = resolvedState.status === 'setup';
  const isSearching = !isControlled && resolvedState.status === 'loading';

  const runSearch = useCallback(async () => {
    if (isControlled) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSearchValidation('Enter a game title to search.');
      return;
    }

    setSearchValidation(null);
    importMutation.reset();
    setState({ status: 'loading' });

    try {
      const result = await searchAdminIgdb(trimmed);
      if (isSetupResponse(result)) {
        setState({ status: 'setup', message: result.message });
        return;
      }

      const data = parseIgdbResults(result);
      if (data.length === 0) {
        setState({ status: 'empty' });
        return;
      }

      setState({ status: 'success', data });
    } catch (error: unknown) {
      setState({ status: 'error', message: apiErrorMessage(error) });
    } finally {
      setIsRetrying(false);
    }
  }, [importMutation, isControlled, query]);

  const handleSearch = useCallback(() => {
    void runSearch();
  }, [runSearch]);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    void runSearch();
  }, [runSearch]);

  const handleImportConfirm = useCallback(
    async (options: {
      igdbId: number;
      platform: string;
      priceBase: number;
      slug?: string;
    }) => {
      if (isControlled || isSetup) {
        return;
      }

      const result = await importMutation.mutate(async () => {
        const response = await importAdminIgdbGame(options);
        if (isSetupResponse(response)) {
          throw new Error(response.message);
        }
        return response;
      });

      if (result?.game?.id) {
        setImportTarget(null);
        router.push(`/admin/games/${result.game.id}/edit`);
      }
    },
    [importMutation, isControlled, isSetup, router],
  );

  return (
    <Container>
      <AdminPageShell>
        <AdminIgdbHeader />
        <AdminIgdbSearch
          query={query}
          searching={isSearching}
          disabled={isControlled || isSetup}
          onQueryChange={(value) => {
            setQuery(value);
            if (searchValidation) {
              setSearchValidation(null);
            }
          }}
          onSearch={handleSearch}
        />
        {searchValidation ? (
          <p className={styles.searchValidation} role="alert">
            {searchValidation}
          </p>
        ) : null}
        {importMutation.error ? (
          <div
            className={`${adminStyles.banner} ${adminStyles.bannerError}`}
            role="alert"
            data-testid="admin-igdb-import-error"
          >
            <p>{importMutation.error}</p>
          </div>
        ) : null}
        {resolvedState.status === 'idle' ? (
          <div data-testid="admin-igdb-results-empty">
            <Text tone="muted">Search results will appear here.</Text>
          </div>
        ) : (
          <AdminAsyncView
            state={resolvedState}
            emptyMessage="No IGDB matches found."
            onRetry={isControlled ? undefined : handleRetry}
            isRetrying={isRetrying}
          >
            {(results) => (
              <>
                <Text tone="dim" className={styles.resultsMeta}>
                  {results.length} result{results.length === 1 ? '' : 's'} (max 20)
                </Text>
                <AdminIgdbResultsGrid
                  results={results}
                  importingId={
                    importMutation.status === 'pending'
                      ? importTarget?.igdbId ?? null
                      : null
                  }
                  disabled={isControlled || isSetup || importMutation.status === 'pending'}
                  onImport={(igdbId) => {
                    const item = results.find((row) => row.igdbId === igdbId);
                    if (item) {
                      importMutation.reset();
                      setImportTarget(item);
                    }
                  }}
                />
              </>
            )}
          </AdminAsyncView>
        )}
        <AdminIgdbImportDialog
          item={importTarget}
          importing={importMutation.status === 'pending'}
          onClose={() => {
            if (importMutation.status !== 'pending') {
              setImportTarget(null);
            }
          }}
          onConfirm={(options) => void handleImportConfirm(options)}
        />
      </AdminPageShell>
    </Container>
  );
}
