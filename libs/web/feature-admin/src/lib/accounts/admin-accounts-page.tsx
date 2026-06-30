'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminAccounts } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { AdminAccountsEmpty } from './admin-accounts-empty';
import { AdminAccountsGameFilter } from './admin-accounts-game-filter';
import { AdminAccountsHeader } from './admin-accounts-header';
import { AdminAccountsTable } from './admin-accounts-table';
import type { AdminAccountListItem } from './admin-accounts.types';

export type AdminAccountsPageProps = {
  listState?: AdminAsyncState<AdminAccountListItem[]>;
};

function parseAccountsList(data: unknown): AdminAccountListItem[] {
  return Array.isArray(data) ? (data as AdminAccountListItem[]) : [];
}

export function AdminAccountsPage({ listState }: AdminAccountsPageProps) {
  const fetchedState = useAdminListState(() => getAdminAccounts(), parseAccountsList);
  const state = listState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminAccountsHeader />
        <AdminAccountsGameFilter />
        <AdminAsyncView state={state} emptyMessage="No pool accounts yet.">
          {(accounts) =>
            accounts.length === 0 ? (
              <AdminAccountsEmpty />
            ) : (
              <AdminAccountsTable accounts={accounts} />
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
