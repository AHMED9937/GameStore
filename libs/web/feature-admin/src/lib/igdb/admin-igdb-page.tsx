'use client';

import { Container } from '@gamestore/shared/ui';
import { searchAdminIgdb } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
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
  const fetchedState = useAdminListState(
    () => searchAdminIgdb(''),
    parseIgdbResults,
  );
  const state = resultsState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminIgdbHeader />
        <AdminIgdbSearch />
        <AdminAsyncView state={state}>
          {(results) => <AdminIgdbResultsGrid results={results} />}
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
