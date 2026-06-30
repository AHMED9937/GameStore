import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminAccountsEmpty } from './admin-accounts-empty';
import { AdminAccountsGameFilter } from './admin-accounts-game-filter';
import { AdminAccountsHeader } from './admin-accounts-header';
import { AdminAccountsTable } from './admin-accounts-table';
import { ADMIN_ACCOUNTS_SETUP_MESSAGE } from './accounts.constants';
import type { AdminAccountListItem } from './admin-accounts.types';

export type AdminAccountsPageProps = {
  listState?: AdminAsyncState<AdminAccountListItem[]>;
};

const DEFAULT_LIST_STATE: AdminAsyncState<AdminAccountListItem[]> = {
  status: 'setup',
  message: ADMIN_ACCOUNTS_SETUP_MESSAGE,
};

export function AdminAccountsPage({
  listState = DEFAULT_LIST_STATE,
}: AdminAccountsPageProps) {
  return (
    <Container>
      <AdminPageShell>
        <AdminAccountsHeader />
        <AdminAccountsGameFilter />
        <AdminAsyncView
          state={listState}
          emptyMessage="No pool accounts yet."
        >
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
