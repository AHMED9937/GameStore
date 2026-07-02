'use client';

import { useCallback, useEffect, useState } from 'react';
import { Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  deactivateAdminAccount,
  getAdminAccounts,
  isSetupResponse,
  reactivateAdminAccount,
  type AdminAccountRecord,
} from '@gamestore/web/data-access';
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

function toListItem(account: AdminAccountRecord): AdminAccountListItem {
  return {
    id: account.id,
    gameTitle: account.gameTitle,
    username: account.username,
    platform: account.platform,
    region: account.region,
    activeUsersCount: account.activeUsersCount,
    maxActiveUsers: account.maxActiveUsers,
    isActive: account.isActive,
  };
}

function parseAccountsList(data: unknown): AdminAccountListItem[] {
  return Array.isArray(data)
    ? (data as AdminAccountRecord[]).map(toListItem)
    : [];
}

export function AdminAccountsPage({ listState }: AdminAccountsPageProps) {
  const isControlled = listState !== undefined;
  const [gameId, setGameId] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AdminAccountListItem[]>([]);

  const fetchAccounts = useCallback(
    () => getAdminAccounts(gameId || undefined),
    [gameId],
  );

  const fetchedState = useAdminListState(fetchAccounts, parseAccountsList, [gameId]);
  const state = listState ?? fetchedState;

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setAccounts(state.data);
    }
  }, [isControlled, state]);

  const handleDeactivate = useCallback(
    async (accountId: string) => {
      if (isControlled) {
        return;
      }
      if (!window.confirm('Deactivate this pool account?')) {
        return;
      }
      setDeactivatingId(accountId);
      setActionError(null);
      try {
        await deactivateAdminAccount(accountId);
        const result = await getAdminAccounts(gameId || undefined);
        if (!isSetupResponse(result)) {
          setAccounts(parseAccountsList(result));
        }
      } catch (error: unknown) {
        setActionError(apiErrorMessage(error));
      } finally {
        setDeactivatingId(null);
      }
    },
    [gameId, isControlled],
  );

  const handleReactivate = useCallback(
    async (accountId: string) => {
      if (isControlled) {
        return;
      }
      if (!window.confirm('Reactivate this pool account?')) {
        return;
      }
      setReactivatingId(accountId);
      setActionError(null);
      try {
        await reactivateAdminAccount(accountId);
        const result = await getAdminAccounts(gameId || undefined);
        if (!isSetupResponse(result)) {
          setAccounts(parseAccountsList(result));
        }
      } catch (error: unknown) {
        setActionError(apiErrorMessage(error));
      } finally {
        setReactivatingId(null);
      }
    },
    [gameId, isControlled],
  );

  const tableAccounts =
    isControlled && state.status === 'success' ? state.data : accounts;

  return (
    <Container>
      <AdminPageShell>
        <AdminAccountsHeader />
        <AdminAccountsGameFilter
          gameId={gameId}
          disabled={isControlled}
          onGameIdChange={setGameId}
        />
        {actionError ? (
          <p role="alert" data-testid="admin-accounts-action-error">
            {actionError}
          </p>
        ) : null}
        <AdminAsyncView state={state} emptyMessage="No pool accounts yet.">
          {(items) =>
            items.length === 0 ? (
              <AdminAccountsEmpty />
            ) : (
              <AdminAccountsTable
                accounts={tableAccounts.length > 0 ? tableAccounts : items}
                deactivatingId={deactivatingId}
                reactivatingId={reactivatingId}
                onDeactivate={isControlled ? undefined : handleDeactivate}
                onReactivate={isControlled ? undefined : handleReactivate}
              />
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
