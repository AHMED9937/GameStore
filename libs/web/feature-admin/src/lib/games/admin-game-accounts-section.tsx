'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Input, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  assignAdminAccountToGame,
  getAdminAccounts,
  getAvailableAdminAccounts,
  isSetupResponse,
  setAdminGameNextAccount,
  type AdminAccountPoolStatus,
  type AdminAccountRecord,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import styles from './games.module.css';

export type AdminGameAccountsSectionProps = {
  gameId: string;
  nextAccountId?: string | null;
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

function poolStatusLabel(status: AdminAccountPoolStatus): string {
  switch (status) {
    case 'inactive':
      return 'Inactive';
    case 'locked':
      return 'Locked (Steam Guard)';
    case 'full':
      return 'Full';
    case 'available':
      return 'Available';
  }
}

function poolStatusBadgeVariant(
  status: AdminAccountPoolStatus,
): 'success' | 'accent' | 'default' {
  switch (status) {
    case 'available':
      return 'success';
    case 'full':
    case 'locked':
      return 'accent';
    case 'inactive':
      return 'default';
  }
}

function formatLockExpiry(lockedUntil: string | null): string | null {
  if (!lockedUntil) {
    return null;
  }
  const date = new Date(lockedUntil);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString();
}

function openSeatsFor(account: AdminAccountRecord): number {
  if (typeof account.openSeats === 'number') {
    return account.openSeats;
  }
  return Math.max(0, account.maxActiveUsers - account.activeUsersCount);
}

function isClaimableAccount(account: AdminAccountRecord): boolean {
  if (typeof account.isClaimable === 'boolean') {
    return account.isClaimable;
  }
  return (
    account.isActive &&
    openSeatsFor(account) > 0 &&
    !(account.lockedUntil && new Date(account.lockedUntil).getTime() > Date.now())
  );
}

function resolvePoolStatus(account: AdminAccountRecord): AdminAccountPoolStatus {
  if (account.poolStatus) {
    return account.poolStatus;
  }
  if (!account.isActive) {
    return 'inactive';
  }
  if (account.lockedUntil && new Date(account.lockedUntil).getTime() > Date.now()) {
    return 'locked';
  }
  if (openSeatsFor(account) <= 0) {
    return 'full';
  }
  return 'available';
}

export function AdminGameAccountsSection({
  gameId,
  nextAccountId = null,
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
  const [mutatingId, setMutatingId] = useState<string | null>(null);
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

  async function handleSetNext(account: AdminAccountRecord) {
    const status = resolvePoolStatus(account);
    if (!account.isActive) {
      setMutationError('Only active accounts can be set as next for buyers');
      return;
    }
    if (status === 'locked') {
      setMutationError('Cannot set a Steam Guard–locked account as next for buyers');
      return;
    }
    setMutationError(null);
    setMutatingId(account.id);
    try {
      const result = await setAdminGameNextAccount(gameId, account.id);
      if (isSetupResponse(result)) {
        setMutationError(result.message);
        return;
      }
      notifyChange();
    } catch (err) {
      setMutationError(apiErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  }

  const activeCount = accounts.filter((account) => account.isActive).length;
  const claimableCount = accounts.filter((account) => isClaimableAccount(account)).length;
  const busy = disabled || linking || mutatingId !== null;

  return (
    <div data-testid="admin-game-accounts-section">
      <Text tone="muted">
        Linked pool accounts: {accounts.length} total · {activeCount} active ·{' '}
        {claimableCount} claimable
      </Text>
      <Text tone="muted">
        Link accounts and choose the next buyer account here. Edit credentials,
        capacity, Steam Guard lock, deactivate, or unassign on the account edit
        page.
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
        accounts.length === 0 ? (
          <Text tone="dim">No linked accounts yet.</Text>
        ) : (
          <ul className={styles.mediaList}>
            {accounts.map((account) => {
              const status = resolvePoolStatus(account);
              const isNext = nextAccountId === account.id;
              const lockLabel = formatLockExpiry(account.lockedUntil);
              const seats = `${account.activeUsersCount}/${account.maxActiveUsers} seats`;
              const nextNote = isNext
                ? status === 'available'
                  ? ' · Next for buyers'
                  : ' · Next for buyers (failover until claimable)'
                : '';

              return (
                <li key={account.id} className={styles.mediaRow}>
                  <div>
                    <strong>{account.username}</strong> {account.region}
                    <div className={styles.mediaUrl}>
                      <Badge variant={poolStatusBadgeVariant(status)}>
                        {poolStatusLabel(status)}
                      </Badge>{' '}
                      {seats}
                      {openSeatsFor(account) > 0 && status !== 'inactive'
                        ? ` · ${openSeatsFor(account)} open`
                        : ''}
                      {lockLabel ? ` · until ${lockLabel}` : ''}
                      {nextNote}
                    </div>
                  </div>
                  <div className={styles.mediaRowActions}>
                    {account.isActive && !isNext && status !== 'locked' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void handleSetNext(account)}
                        data-testid={`admin-game-set-next-${account.id}`}
                      >
                        Set as next
                      </Button>
                    ) : null}
                    <Link
                      href={`/admin/accounts/${encodeURIComponent(account.id)}`}
                      data-testid={`admin-game-edit-account-${account.id}`}
                    >
                      Edit account
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )
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
            disabled={busy}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter by username…"
            data-testid="admin-game-account-search"
          />
          <Text tone="dim">
            {debouncedSearch.trim()
              ? 'Matching unassigned inventory accounts.'
              : 'Showing the 3 most recently added inventory accounts. Search to find others.'}
          </Text>
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
                  disabled={busy}
                  onChange={() => setSelectedAccountId(account.id)}
                />
                <span>
                  <strong>{account.username}</strong> {account.region} ·{' '}
                  {poolStatusLabel(resolvePoolStatus(account))}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {!searchLoading && availableAccounts.length === 0 ? (
          <Text tone="dim">
            {debouncedSearch.trim()
              ? 'No unassigned accounts match your search.'
              : 'No unassigned inventory accounts yet.'}
          </Text>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !selectedAccountId}
          onClick={() => void handleLink()}
        >
          {linking ? 'Linking…' : 'Link account'}
        </Button>
      </div>
    </div>
  );
}
