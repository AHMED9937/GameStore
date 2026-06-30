import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminLicensesEmpty } from './admin-licenses-empty';
import { AdminLicensesFilters } from './admin-licenses-filters';
import { AdminLicensesHeader } from './admin-licenses-header';
import { AdminLicensesTable } from './admin-licenses-table';
import { ADMIN_LICENSES_SETUP_MESSAGE } from './licenses.constants';
import type { AdminLicenseListItem } from './admin-licenses.types';

export type AdminLicensesPageProps = {
  listState?: AdminAsyncState<AdminLicenseListItem[]>;
};

const DEFAULT_LIST_STATE: AdminAsyncState<AdminLicenseListItem[]> = {
  status: 'setup',
  message: ADMIN_LICENSES_SETUP_MESSAGE,
};

export function AdminLicensesPage({
  listState = DEFAULT_LIST_STATE,
}: AdminLicensesPageProps) {
  return (
    <Container>
      <AdminPageShell>
        <AdminLicensesHeader />
        <AdminLicensesFilters />
        <AdminAsyncView
          state={listState}
          emptyMessage="No licenses issued yet."
        >
          {(licenses) =>
            licenses.length === 0 ? (
              <AdminLicensesEmpty />
            ) : (
              <AdminLicensesTable licenses={licenses} />
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
