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
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminIgdbHeader } from './admin-igdb-header';
import { AdminIgdbResultsGrid } from './admin-igdb-results-grid';
import { AdminIgdbSearch } from './admin-igdb-search';
import type { AdminIgdbResultItem } from './admin-igdb.types';

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
  const [importingId, setImportingId] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const resolvedState = resultsState ?? state;
  const isControlled = resultsState !== undefined;
  const isSetup = resolvedState.status === 'setup';
  const isSearching = !isControlled && resolvedState.status === 'loading';

  const handleSearch = useCallback(async () => {
    if (isControlled) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setImportError(null);
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
    }
  }, [isControlled, query]);

  const handleImport = useCallback(
    async (igdbId: number) => {
      if (isControlled || isSetup) {
        return;
      }

      setImportError(null);
      setImportingId(igdbId);

      try {
        const result = await importAdminIgdbGame({ igdbId });
        if (isSetupResponse(result)) {
          setImportError(result.message);
          return;
        }

        router.push(`/admin/games/${result.game.id}/edit`);
      } catch (error: unknown) {
        setImportError(apiErrorMessage(error));
      } finally {
        setImportingId(null);
      }
    },
    [isControlled, isSetup, router],
  );

  return (
    <Container>
      <AdminPageShell>
        <AdminIgdbHeader />
        <AdminIgdbSearch
          query={query}
          searching={isSearching}
          disabled={isControlled || isSetup}
          onQueryChange={setQuery}
          onSearch={() => {
            void handleSearch();
          }}
        />
        {importError ? (
          <div role="alert" data-testid="admin-igdb-import-error">
            <Text tone="muted">{importError}</Text>
          </div>
        ) : null}
        {resolvedState.status === 'idle' ? (
          <div data-testid="admin-igdb-results-empty">
            <Text tone="muted">Search results will appear here.</Text>
          </div>
        ) : (
          <AdminAsyncView state={resolvedState} emptyMessage="No IGDB matches found.">
            {(results) => (
              <AdminIgdbResultsGrid
                results={results}
                importingId={importingId}
                disabled={isControlled || isSetup}
                onImport={(igdbId) => {
                  void handleImport(igdbId);
                }}
              />
            )}
          </AdminAsyncView>
        )}
      </AdminPageShell>
    </Container>
  );
}
