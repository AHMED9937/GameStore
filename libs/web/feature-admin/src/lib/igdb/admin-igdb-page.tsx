import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminIgdbHeader } from './admin-igdb-header';
import { AdminIgdbResultsGrid } from './admin-igdb-results-grid';
import { AdminIgdbSearch } from './admin-igdb-search';
import type { AdminIgdbResultItem } from './admin-igdb.types';
import { ADMIN_IGDB_SETUP_MESSAGE } from './igdb.constants';

export type AdminIgdbPageProps = {
  resultsState?: AdminAsyncState<AdminIgdbResultItem[]>;
};

const DEFAULT_RESULTS_STATE: AdminAsyncState<AdminIgdbResultItem[]> = {
  status: 'setup',
  message: ADMIN_IGDB_SETUP_MESSAGE,
};

export function AdminIgdbPage({
  resultsState = DEFAULT_RESULTS_STATE,
}: AdminIgdbPageProps) {
  return (
    <Container>
      <AdminPageShell>
        <AdminIgdbHeader />
        <AdminIgdbSearch />
        <AdminAsyncView state={resultsState}>
          {(results) => <AdminIgdbResultsGrid results={results} />}
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
