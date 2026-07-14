'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  bulkDeactivateAdminAccounts,
  bulkDeleteAdminAccounts,
  deactivateAdminAccount,
  getAdminAccounts,
  isSetupResponse,
  reactivateAdminAccount,
  type AdminAccountListFilters,
  type AdminAccountRecord,
} from '@gamestore/web/data-access';
import { AdminActionFeedback } from '../components/admin-action-feedback';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminBulkToolbar } from '../components/admin-bulk-toolbar';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminRowSelection } from '../components/use-admin-row-selection';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminActionFeedback } from '../hooks/use-admin-action-feedback';
import { useAdminListState } from '../hooks/use-admin-resource';
import { useAdminListFilters } from '../hooks/use-admin-list-filters';
import { formatBulkActionSummary } from '../utils/bulk-action-summary';
import { resolveAdminTableRows } from '../utils/resolve-admin-table-rows';
import { AdminAccountsEmpty } from './admin-accounts-empty';
import { AdminAccountsHeader } from './admin-accounts-header';
import { AdminAccountsTable } from './admin-accounts-table';
import {
  AdminAccountsFilters,
  type AdminAccountFilterDraft,
} from './admin-accounts-filters';
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
    lockedUntil: account.lockedUntil ?? null,
    openSeats:
      account.openSeats ??
      Math.max(0, account.maxActiveUsers - account.activeUsersCount),
    isClaimable: account.isClaimable ?? account.isActive,
    poolStatus: account.poolStatus ?? (account.isActive ? 'available' : 'inactive'),
  };
}

function parseAccountsList(data: unknown): AdminAccountListItem[] {
  return Array.isArray(data)
    ? (data as AdminAccountRecord[]).map(toListItem)
    : [];
}

function canDeleteAccount(account: AdminAccountListItem): boolean {
  return !account.isActive && account.activeUsersCount === 0;
}

const emptyAccountFilters: AdminAccountFilterDraft = {
  q: '',
  status: '',
  platform: '',
};

export function AdminAccountsPage({ listState }: AdminAccountsPageProps) {
  const isControlled = listState !== undefined;
  const { draft, setDraft, activeFilters, hasActiveFilters } =
    useAdminListFilters<AdminAccountFilterDraft>({
      initial: emptyAccountFilters,
      textKeys: ['q'],
    });
  const queryFilters = useMemo<AdminAccountListFilters>(
    () => ({
      ...(activeFilters.q ? { q: activeFilters.q } : {}),
      ...(activeFilters.status
        ? { status: activeFilters.status as AdminAccountListFilters['status'] }
        : {}),
      ...(activeFilters.platform ? { platform: activeFilters.platform } : {}),
    }),
    [activeFilters],
  );
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const actionFeedback = useAdminActionFeedback();
  const [accounts, setAccounts] = useState<AdminAccountListItem[]>([]);

  const { state: fetchedState } = useAdminListState(
    () => getAdminAccounts(queryFilters),
    parseAccountsList,
    [queryFilters],
  );
  const state = listState ?? fetchedState;

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setAccounts(state.data);
    }
  }, [isControlled, state]);

  const tableAccounts = resolveAdminTableRows(isControlled, state, accounts);

  const accountById = useMemo(
    () => new Map(tableAccounts.map((account) => [account.id, account])),
    [tableAccounts],
  );

  const selection = useAdminRowSelection({
    rowIds: tableAccounts.map((account) => account.id),
    isRowSelectable: (id) => {
      const account = accountById.get(id);
      if (!account) {
        return false;
      }
      return account.isActive || canDeleteAccount(account);
    },
  });

  const refreshList = useCallback(async () => {
    if (isControlled) {
      return;
    }
    const result = await getAdminAccounts(queryFilters);
    if (!isSetupResponse(result)) {
      setAccounts(parseAccountsList(result));
    }
  }, [isControlled, queryFilters]);

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
    actionFeedback.clearForAction();
    try {
      const result = await bulkDeactivateAdminAccounts(selection.selectedIds);
      if (isSetupResponse(result)) {
        actionFeedback.setError(result.message);
        return;
      }
      actionFeedback.setMessage(formatBulkActionSummary(result, 'deactivated'));
      selection.clearSelection();
      await refreshList();
    } catch (error: unknown) {
      actionFeedback.setError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [actionFeedback, isControlled, refreshList, selection]);

  const handleBulkDelete = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    const deletableIds = selection.selectedIds.filter((id) => {
      const account = accountById.get(id);
      return account ? canDeleteAccount(account) : false;
    });
    if (deletableIds.length === 0) {
      actionFeedback.setError('Select inactive accounts with no active license assignments.');
      return;
    }
    if (
      !window.confirm(
        `Delete ${deletableIds.length} selected account(s)? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    actionFeedback.clearForAction();
    try {
      const result = await bulkDeleteAdminAccounts(deletableIds);
      if (isSetupResponse(result)) {
        actionFeedback.setError(result.message);
        return;
      }
      actionFeedback.setMessage(formatBulkActionSummary(result, 'deleted'));
      selection.clearSelection();
      await refreshList();
    } catch (error: unknown) {
      actionFeedback.setError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [accountById, actionFeedback, isControlled, refreshList, selection]);

  const router = useRouter();
  const handleDeactivate = useCallback(
    async (accountId: string) => {
      if (isControlled) {
        return;
      }
      const row = accountById.get(accountId);
      if (row && row.activeUsersCount > 0) {
        actionFeedback.setError(
          'Open account edit to move occupied seats before deactivating.',
        );
        router.push(`/admin/accounts/${encodeURIComponent(accountId)}`);
        return;
      }
      if (!window.confirm('Unassign (if linked) and deactivate this pool account?')) {
        return;
      }
      setDeactivatingId(accountId);
      actionFeedback.clearForAction();
      try {
        await deactivateAdminAccount(accountId);
        actionFeedback.setMessage('Account deactivated.');
        await refreshList();
      } catch (error: unknown) {
        actionFeedback.setError(apiErrorMessage(error));
      } finally {
        setDeactivatingId(null);
      }
    },
    [accountById, actionFeedback, isControlled, refreshList, router],
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
      actionFeedback.clearForAction();
      try {
        await reactivateAdminAccount(accountId);
        actionFeedback.setMessage('Account reactivated.');
        await refreshList();
      } catch (error: unknown) {
        actionFeedback.setError(apiErrorMessage(error));
      } finally {
        setReactivatingId(null);
      }
    },
    [actionFeedback, isControlled, refreshList],
  );

  return (
    <Container>
      <AdminPageShell>
        <AdminAccountsHeader />
        <AdminAccountsFilters
          draft={draft}
          disabled={isControlled}
          onDraftChange={(patch) => setDraft(patch)}
        />
        <AdminActionFeedback
          error={actionFeedback.error}
          message={actionFeedback.message}
          isPending={
            bulkLoading || deactivatingId !== null || reactivatingId !== null
          }
          pendingMessage={
            bulkLoading
              ? 'Applying bulk action…'
              : deactivatingId
                ? 'Deactivating account…'
                : 'Reactivating account…'
          }
          testIdPrefix="admin-accounts-action"
        />
        <AdminAsyncView
          state={state}
          emptyMessage={
            hasActiveFilters
              ? 'No accounts match the current filters.'
              : 'No pool accounts yet.'
          }
        >
          {() =>
            tableAccounts.length === 0 ? (
              hasActiveFilters ? (
                <AdminAccountsEmpty message="No accounts match the current filters." />
              ) : (
                <AdminAccountsEmpty />
              )
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
                      {bulkLoading ? 'Deactivating…' : 'Deactivate selected'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={bulkLoading}
                      onClick={() => void handleBulkDelete()}
                    >
                      {bulkLoading ? 'Deleting…' : 'Delete selected'}
                    </Button>
                  </AdminBulkToolbar>
                ) : null}
                <AdminAccountsTable
                  accounts={tableAccounts}
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
