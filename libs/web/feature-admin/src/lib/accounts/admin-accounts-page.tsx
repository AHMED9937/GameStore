'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  bulkDeactivateAdminAccounts,
  deactivateAdminAccount,
  getAdminAccounts,
  isSetupResponse,
  reactivateAdminAccount,
  type AdminAccountRecord,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminBulkToolbar } from '../components/admin-bulk-toolbar';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminRowSelection } from '../components/use-admin-row-selection';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { formatBulkActionSummary } from '../utils/bulk-action-summary';
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
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
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

  const tableAccounts =
    isControlled && state.status === 'success' ? state.data : accounts;

  const accountById = useMemo(
    () => new Map(tableAccounts.map((account) => [account.id, account])),
    [tableAccounts],
  );

  const selection = useAdminRowSelection({
    rowIds: tableAccounts.map((account) => account.id),
    isRowSelectable: (id) => accountById.get(id)?.isActive ?? false,
  });

  const refreshList = useCallback(async () => {
    if (isControlled) {
      return;
    }
    const result = await getAdminAccounts(gameId || undefined);
    if (!isSetupResponse(result)) {
      setAccounts(parseAccountsList(result));
    }
  }, [gameId, isControlled]);

  const handleBulkDeactivate = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Deactivate ${selection.selectedIds.length} selected account(s)?`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await bulkDeactivateAdminAccounts(selection.selectedIds);
      if (isSetupResponse(result)) {
        setActionError(result.message);
        return;
      }
      setActionMessage(formatBulkActionSummary(result, 'deactivated'));
      selection.clearSelection();
      await refreshList();
    } catch (error: unknown) {
      setActionError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [gameId, isControlled, refreshList, selection]);

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
        await refreshList();
      } catch (error: unknown) {
        setActionError(apiErrorMessage(error));
      } finally {
        setDeactivatingId(null);
      }
    },
    [isControlled, refreshList],
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
        await refreshList();
      } catch (error: unknown) {
        setActionError(apiErrorMessage(error));
      } finally {
        setReactivatingId(null);
      }
    },
    [isControlled, refreshList],
  );

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
        {actionMessage ? (
          <p data-testid="admin-accounts-action-message">{actionMessage}</p>
        ) : null}
        <AdminAsyncView state={state} emptyMessage="No pool accounts yet.">
          {(items) =>
            items.length === 0 ? (
              <AdminAccountsEmpty />
            ) : (
              <>
                {!isControlled ? (
                  <AdminBulkToolbar
                    selectedCount={selection.selectedCount}
                    onClear={selection.clearSelection}
                    disabled={bulkLoading}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={bulkLoading}
                      onClick={() => void handleBulkDeactivate()}
                    >
                      Deactivate selected
                    </Button>
                  </AdminBulkToolbar>
                ) : null}
                <AdminAccountsTable
                  accounts={tableAccounts.length > 0 ? tableAccounts : items}
                  deactivatingId={deactivatingId}
                  reactivatingId={reactivatingId}
                  onDeactivate={isControlled ? undefined : handleDeactivate}
                  onReactivate={isControlled ? undefined : handleReactivate}
                  selection={
                    isControlled
                      ? undefined
                      : {
                          ...selection,
                          disabled: bulkLoading,
                        }
                  }
                />
              </>
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
