'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminLicenses } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { AdminLicensesEmpty } from './admin-licenses-empty';
import { AdminLicensesFilters } from './admin-licenses-filters';
import { AdminLicensesHeader } from './admin-licenses-header';
import { AdminLicensesTable } from './admin-licenses-table';
import type { AdminLicenseListItem } from './admin-licenses.types';

export type AdminLicensesPageProps = {
  listState?: AdminAsyncState<AdminLicenseListItem[]>;
};

function parseLicensesList(data: unknown): AdminLicenseListItem[] {
  return Array.isArray(data) ? (data as AdminLicenseListItem[]) : [];
}

export function AdminLicensesPage({ listState }: AdminLicensesPageProps) {
  const fetchedState = useAdminListState(() => getAdminLicenses(), parseLicensesList);
  const state = listState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminLicensesHeader />
        <AdminLicensesFilters />
        <AdminAsyncView state={state} emptyMessage="No licenses issued yet.">
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
