'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  assignAdminAccountToGame,
  deactivateAdminAccount,
  getAdminAccounts,
  getAvailableAdminAccounts,
  isSetupResponse,
  unassignAdminAccount,
  type AdminAccountRecord,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import styles from './games.module.css';

export type AdminGameAccountsSectionProps = {
  gameId: string;
  disabled?: boolean;
  onAccountsChange?: () => void;
};

function parseAccountsList(data: unknown): AdminAccountRecord[] {
  return Array.isArray(data) ? (data as AdminAccountRecord[]) : [];
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function AdminGameAccountsSection({
  gameId,
  disabled = false,
  onAccountsChange,
}: AdminGameAccountsSectionProps) {
  const {
    state: linkedState,
    refetch: refetchLinked,
    isRefetching,
  } = useAdminResourceState(
    () => getAdminAccounts({ gameId }),
    parseAccountsList,
    {
      deps: [gameId],
    },
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState<AdminAccountRecord[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [linking, setLinking] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const accounts = linkedState.status === 'success' ? linkedState.data : [];

  const notifyChange = useCallback(() => {
    onAccountsChange?.();
  }, [onAccountsChange]);

  const loadAvailable = useCallback(async (query: string) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const result = await getAvailableAdminAccounts(query);
      if (isSetupResponse(result)) {
        setSearchError(result.message);
        setAvailableAccounts([]);
        return;
      }
      setAvailableAccounts(result);
      setSelectedAccountId((current) =>
        current && result.some((account) => account.id === current)
          ? current
          : (result[0]?.id ?? ''),
      );
    } catch (err) {
      setSearchError(apiErrorMessage(err));
      setAvailableAccounts([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvailable(debouncedSearch);
  }, [debouncedSearch, loadAvailable]);

  async function handleLink() {
    if (!selectedAccountId) {
      setMutationError('Select an account to link');
      return;
    }
    setLinking(true);
    setMutationError(null);
    try {
      const result = await assignAdminAccountToGame(selectedAccountId, gameId);
      if (isSetupResponse(result)) {
        setMutationError(result.message);
        return;
      }
      setSearchQuery('');
      setSelectedAccountId('');
      refetchLinked();
      await loadAvailable('');
      notifyChange();
    } catch (err) {
      setMutationError(apiErrorMessage(err));
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(account: AdminAccountRecord) {
    if (!window.confirm(`Unlink ${account.username} from this game?`)) {
      return;
    }
    setMutationError(null);
    try {
      await unassignAdminAccount(account.id);
      refetchLinked();
      await loadAvailable(debouncedSearch);
      notifyChange();
    } catch (err) {
      setMutationError(apiErrorMessage(err));
    }
  }

  async function handleDeactivate(accountId: string) {
    if (!window.confirm('Deactivate this pool account?')) {
      return;
    }
    setMutationError(null);
    try {
      await deactivateAdminAccount(accountId);
      refetchLinked();
      notifyChange();
    } catch (err) {
      setMutationError(apiErrorMessage(err));
    }
  }

  const activeCount = accounts.filter((account) => account.isActive).length;
  const canUnlink = (account: AdminAccountRecord) =>
    !account.isActive && account.activeUsersCount === 0;

  return (
    <div data-testid="admin-game-accounts-section">
      <Text tone="muted">
        Linked pool accounts: {accounts.length} total · {activeCount} active
      </Text>
      {linkedState.status !== 'success' ? (
        <AdminAsyncView
          state={linkedState}
          emptyMessage="No linked accounts yet."
          onRetry={refetchLinked}
          isRetrying={isRefetching}
        >
          {() => null}
        </AdminAsyncView>
      ) : null}
      {mutationError ? (
        <Text tone="muted" role="alert">
          {mutationError}
        </Text>
      ) : null}
      {searchError ? (
        <Text tone="muted" role="alert">
          {searchError}
        </Text>
      ) : null}
      {linkedState.status === 'success' ? (
        <ul className={styles.mediaList}>
          {accounts.map((account) => (
            <li key={account.id} className={styles.mediaRow}>
              <div>
                <strong>{account.username}</strong> {account.region}
                <div className={styles.mediaUrl}>
                  {account.isActive ? 'Active' : 'Inactive'} ·{' '}
                  {account.activeUsersCount} active users
                </div>
              </div>
              <div className={styles.mediaRowActions}>
                {canUnlink(account) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => void handleUnlink(account)}
                  >
                    Unlink
                  </Button>
                ) : null}
                {account.isActive ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => void handleDeactivate(account.id)}
                  >
                    Deactivate
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.mediaForm}>
        <Text tone="muted">
          Link an existing unassigned account from inventory. Create new accounts
          at{' '}
          <Link href={`/admin/accounts/new?gameId=${encodeURIComponent(gameId)}`}>
            /admin/accounts/new
          </Link>
          .
        </Text>
        <div className={styles.formField}>
          <Text tone="muted">Search available accounts</Text>
          <Input
            value={searchQuery}
            disabled={disabled || linking}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter by username…"
            data-testid="admin-game-account-search"
          />
        </div>
        {searchLoading ? <Text tone="dim">Searching…</Text> : null}
        <ul className={styles.mediaList} data-testid="admin-game-account-picker">
          {availableAccounts.map((account) => (
            <li key={account.id} className={styles.mediaRow}>
              <label className={styles.pickerOption}>
                <input
                  type="radio"
                  name="availableAccount"
                  value={account.id}
                  checked={selectedAccountId === account.id}
                  disabled={disabled || linking}
                  onChange={() => setSelectedAccountId(account.id)}
                />
                <span>
                  <strong>{account.username}</strong> {account.region}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {!searchLoading && availableAccounts.length === 0 ? (
          <Text tone="dim">No unassigned accounts match your search.</Text>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || linking || !selectedAccountId}
          onClick={() => void handleLink()}
        >
          {linking ? 'Linking…' : 'Link account'}
        </Button>
      </div>
    </div>
  );
}
