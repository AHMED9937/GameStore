'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Container, SkeletonPanel, SkeletonText, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  clearAdminAccountGuardLock,
  deactivateAdminAccount,
  deleteAdminAccount,
  getAdminAccount,
  getAdminAccounts,
  isSetupResponse,
  reactivateAdminAccount,
  unassignAdminAccount,
  updateAdminAccount,
  type AdminAccountPoolStatus,
  type AdminAccountRecord,
} from '@gamestore/web/data-access';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import { AdminAccountDeleteSection } from './admin-account-delete-section';
import { AdminAccountForm } from './admin-account-form';
import {
  EMPTY_ADMIN_ACCOUNT_FORM_VALUES,
  type AdminAccountFormValues,
} from './admin-accounts.types';
import styles from './accounts.module.css';

export type AdminAccountEditPageProps = {
  accountId: string;
};

function toFormValues(account: AdminAccountRecord): AdminAccountFormValues {
  return {
    gameId: account.gameId ?? '',
    gameTitle: account.gameTitle,
    username: account.username,
    platform: account.platform,
    region: account.region,
    maxActiveUsers: String(account.maxActiveUsers),
    password: '',
    sharedSecret: '',
  };
}

function poolStatusLabel(status: AdminAccountPoolStatus): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'full':
      return 'Full';
    case 'locked':
      return 'Locked (Steam Guard)';
    case 'inactive':
      return 'Inactive';
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

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function openSeatsFor(account: AdminAccountRecord): number {
  if (typeof account.openSeats === 'number') {
    return account.openSeats;
  }
  return Math.max(0, account.maxActiveUsers - account.activeUsersCount);
}

function resolvePoolStatus(account: AdminAccountRecord): AdminAccountPoolStatus {
  return account.poolStatus ?? (account.isActive ? 'available' : 'inactive');
}

function ineligibilityReason(
  sibling: AdminAccountRecord,
  seatsNeeded: number,
): string | null {
  const status = resolvePoolStatus(sibling);
  if (status === 'inactive' || !sibling.isActive) {
    return 'Inactive';
  }
  if (status === 'locked') {
    return 'Steam Guard locked';
  }
  if (openSeatsFor(sibling) < seatsNeeded) {
    return 'Not enough open seats';
  }
  if (!sibling.isClaimable) {
    return 'Not claimable';
  }
  return null;
}

function isEligibleDestination(
  sibling: AdminAccountRecord,
  seatsNeeded: number,
): boolean {
  return ineligibilityReason(sibling, seatsNeeded) === null;
}

export function AdminAccountEditPage({ accountId }: AdminAccountEditPageProps) {
  const router = useRouter();
  const [account, setAccount] = useState<AdminAccountRecord | null>(null);
  const [values, setValues] = useState<AdminAccountFormValues>(
    EMPTY_ADMIN_ACCOUNT_FORM_VALUES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<AdminAccountRecord[]>([]);
  const [siblingsLoading, setSiblingsLoading] = useState(false);
  const [targetAccountId, setTargetAccountId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminAccount(accountId);
      if (isSetupResponse(result)) {
        setError(result.message);
        setAccount(null);
        return;
      }
      setAccount(result);
      setValues(toFormValues(result));
    } catch (loadError: unknown) {
      setError(apiErrorMessage(loadError));
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    void load();
  }, [load]);

  const needsMigrationTarget =
    Boolean(account?.gameId) && (account?.activeUsersCount ?? 0) > 0;

  useEffect(() => {
    if (!account?.gameId || !needsMigrationTarget) {
      setSiblings([]);
      setTargetAccountId('');
      return;
    }

    let cancelled = false;
    setSiblingsLoading(true);
    void (async () => {
      try {
        const result = await getAdminAccounts({ gameId: account.gameId! });
        if (cancelled) {
          return;
        }
        if (isSetupResponse(result)) {
          setSiblings([]);
          setError(result.message);
          return;
        }
        const others = result.filter((row) => row.id !== account.id);
        setSiblings(others);
        setTargetAccountId((current) => {
          if (
            current &&
            others.some(
              (row) =>
                row.id === current &&
                isEligibleDestination(row, account.activeUsersCount),
            )
          ) {
            return current;
          }
          const firstEligible = others.find((row) =>
            isEligibleDestination(row, account.activeUsersCount),
          );
          return firstEligible?.id ?? '';
        });
      } catch (siblingsError: unknown) {
        if (!cancelled) {
          setSiblings([]);
          setError(apiErrorMessage(siblingsError));
        }
      } finally {
        if (!cancelled) {
          setSiblingsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.gameId, account?.id, account?.activeUsersCount, needsMigrationTarget]);

  const busy = saving || actionId !== null || deleting;

  const eligibleSiblings = useMemo(() => {
    if (!account) {
      return [];
    }
    return siblings.filter((row) =>
      isEligibleDestination(row, account.activeUsersCount),
    );
  }, [account, siblings]);

  const selectedTarget = siblings.find((row) => row.id === targetAccountId);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!account) {
        return;
      }

      const maxActiveUsers = Number.parseInt(values.maxActiveUsers, 10);
      if (!Number.isInteger(maxActiveUsers) || maxActiveUsers < 1) {
        setError('Max active users must be a positive integer.');
        return;
      }
      if (maxActiveUsers < account.activeUsersCount) {
        setError(
          `Max active users cannot be below occupied seats (${account.activeUsersCount}).`,
        );
        return;
      }

      setSaving(true);
      setError(null);
      setSavedMessage(null);

      try {
        const payload = {
          region: values.region.trim() || 'global',
          maxActiveUsers,
          ...(values.password.trim() ? { password: values.password.trim() } : {}),
          ...(values.sharedSecret.trim()
            ? { sharedSecret: values.sharedSecret.trim() }
            : {}),
        };

        const result = await updateAdminAccount(account.id, payload);
        if (isSetupResponse(result)) {
          setError(result.message);
          return;
        }

        setAccount(result);
        setValues(toFormValues(result));
        setSavedMessage('Account updated.');
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [account, values],
  );

  const runAccountAction = useCallback(
    async (
      confirmMessage: string,
      action: () => Promise<AdminAccountRecord | { message: string }>,
      successMessage: string,
    ) => {
      if (!account || !window.confirm(confirmMessage)) {
        return;
      }
      setActionId(account.id);
      setError(null);
      setSavedMessage(null);
      try {
        const result = await action();
        if (isSetupResponse(result)) {
          setError(result.message);
          return;
        }
        setAccount(result);
        setValues(toFormValues(result));
        setSavedMessage(successMessage);
      } catch (actionError: unknown) {
        setError(apiErrorMessage(actionError));
      } finally {
        setActionId(null);
      }
    },
    [account],
  );

  const handleDeactivate = useCallback(async () => {
    if (!account) {
      return;
    }
    const occupied = account.activeUsersCount;
    if (account.gameId && occupied > 0) {
      if (!targetAccountId || !selectedTarget) {
        setError('Select a destination account with enough open seats.');
        return;
      }
      await runAccountAction(
        `Move ${occupied} seats to ${selectedTarget.username}, unassign ${account.username}, then deactivate?`,
        () =>
          deactivateAdminAccount(account.id, { targetAccountId }),
        'Account unassigned and deactivated.',
      );
      return;
    }
    if (account.gameId) {
      await runAccountAction(
        `Unassign ${account.username} from this game, then deactivate?`,
        () => deactivateAdminAccount(account.id),
        'Account unassigned and deactivated.',
      );
      return;
    }
    await runAccountAction(
      'Deactivate this pool account? It will leave the buyer pool.',
      () => deactivateAdminAccount(account.id),
      'Account deactivated.',
    );
  }, [account, runAccountAction, selectedTarget, targetAccountId]);

  const handleReactivate = useCallback(async () => {
    if (!account) {
      return;
    }
    await runAccountAction(
      'Reactivate this pool account?',
      () => reactivateAdminAccount(account.id),
      'Account reactivated.',
    );
  }, [account, runAccountAction]);

  const handleClearGuardLock = useCallback(async () => {
    if (!account) {
      return;
    }
    await runAccountAction(
      'Clear the Steam Guard lock on this account? Buyers will be able to claim seats again immediately.',
      () => clearAdminAccountGuardLock(account.id),
      'Steam Guard lock cleared.',
    );
  }, [account, runAccountAction]);

  const handleUnassign = useCallback(async () => {
    if (!account?.gameId) {
      return;
    }
    const occupied = account.activeUsersCount;
    if (occupied > 0) {
      if (!targetAccountId || !selectedTarget) {
        setError('Select a destination account with enough open seats.');
        return;
      }
      await runAccountAction(
        `Move ${occupied} seats to ${selectedTarget.username}, then unassign ${account.username} from this game?`,
        () =>
          unassignAdminAccount(account.id, { targetAccountId }),
        'Account unassigned from game.',
      );
      return;
    }

    await runAccountAction(
      `Unassign ${account.username} from this game?`,
      () => unassignAdminAccount(account.id),
      'Account unassigned from game.',
    );
  }, [account, runAccountAction, selectedTarget, targetAccountId]);

  const handleDelete = useCallback(async () => {
    if (!account) {
      return;
    }
    if (
      !window.confirm(
        'Delete this pool account permanently? This cannot be undone.',
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const result = await deleteAdminAccount(account.id);
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }
      router.push('/admin/accounts');
    } catch (deleteError: unknown) {
      setError(apiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }, [account, router]);

  if (loading) {
    return (
      <Container>
        <AdminPageShell>
          <SkeletonText width="28%" />
          <SkeletonPanel height={120} style={{ marginTop: '0.75rem' }} />
        </AdminPageShell>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container>
        <AdminPageShell>
          <AdminPageHeader title="Account not found" />
          {error ? (
            <Text tone="muted" role="alert">
              {error}
            </Text>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/accounts')}>
            Back to accounts
          </Button>
        </AdminPageShell>
      </Container>
    );
  }

  const poolStatus = resolvePoolStatus(account);
  const openSeats = openSeatsFor(account);
  const migrateBlocked =
    needsMigrationTarget &&
    (siblingsLoading || eligibleSiblings.length === 0 || !targetAccountId);
  const unassignDisabled = busy || migrateBlocked;
  const deactivateDisabled = busy || (account.isActive && migrateBlocked);

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Edit Steam account"
          description="Manage pool status, capacity, credentials, and Steam Guard lock for this account."
        />

        <section
          className={styles.statusPanel}
          data-testid="admin-account-edit-status"
          aria-label="Account status"
        >
          <div className={styles.statusRow}>
            <Badge variant={poolStatusBadgeVariant(poolStatus)}>
              {poolStatusLabel(poolStatus)}
            </Badge>
            <Text tone="muted">
              {account.activeUsersCount} / {account.maxActiveUsers} seats · {openSeats}{' '}
              open
              {account.isClaimable ? ' · claimable' : ' · not claimable'}
            </Text>
          </div>
          {poolStatus === 'locked' ? (
            <Text tone="muted">
              Locked until {formatTimestamp(account.lockedUntil)}
              {account.guardLockedByLicenseId
                ? ` · held by license ${account.guardLockedByLicenseId}`
                : ''}
            </Text>
          ) : null}
          <div className={styles.statusMeta}>
            <Text tone="dim">Created {formatTimestamp(account.createdAt)}</Text>
            <Text tone="dim">
              Last health check {formatTimestamp(account.lastHealthCheck)}
            </Text>
            {account.gameId ? (
              <Link href={`/admin/games/${account.gameId}/edit`}>
                <Text tone="muted">Open game edit</Text>
              </Link>
            ) : (
              <Text tone="muted">Unassigned inventory</Text>
            )}
          </div>
        </section>

        <form
          id="admin-account-edit-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <AdminAccountForm
            mode="edit"
            values={values}
            disabled={busy}
            minMaxActiveUsers={Math.max(1, account.activeUsersCount)}
            onValuesChange={setValues}
          />
          {error ? (
            <div className={styles.formMessage} role="alert" data-testid="admin-account-edit-error">
              <Text tone="muted">{error}</Text>
            </div>
          ) : null}
          {savedMessage ? (
            <div className={styles.formMessage} role="status" data-testid="admin-account-edit-success">
              <Text>{savedMessage}</Text>
            </div>
          ) : null}
        </form>

        {account.gameId ? (
          <section
            className={styles.actionPanel}
            data-testid="admin-account-unassign-panel"
            aria-labelledby="admin-account-unassign-heading"
          >
            <div className={styles.actionPanelHeader}>
              <Text id="admin-account-unassign-heading">Game assignment</Text>
              <Text tone="dim">
                Return this account to inventory. Occupied seats must move to
                another linked account first.
              </Text>
            </div>
            {needsMigrationTarget ? (
              <>
                <Text tone="muted">
                  {account.activeUsersCount} occupied seats will move to the
                  destination below. Buyers keep the same license and get that
                  account&apos;s Steam credentials. Deactivate also unassigns
                  after the move.
                </Text>
                {siblingsLoading ? (
                  <Text tone="dim">Loading linked accounts…</Text>
                ) : (
                  <div className={styles.formField}>
                    <Text tone="muted">Move seats to</Text>
                    <select
                      className={styles.select}
                      value={targetAccountId}
                      disabled={busy || eligibleSiblings.length === 0}
                      onChange={(event) => setTargetAccountId(event.target.value)}
                      aria-label="Destination account for occupied seats"
                      data-testid="admin-account-unassign-target"
                    >
                      {siblings.length === 0 ? (
                        <option value="">No other linked accounts</option>
                      ) : (
                        siblings.map((sibling) => {
                          const status = resolvePoolStatus(sibling);
                          const reason = ineligibilityReason(
                            sibling,
                            account.activeUsersCount,
                          );
                          const seatsLabel = `${sibling.activeUsersCount}/${sibling.maxActiveUsers}`;
                          const label = reason
                            ? `${sibling.username} · ${seatsLabel} · ${poolStatusLabel(status)} (${reason})`
                            : `${sibling.username} · ${seatsLabel} · ${poolStatusLabel(status)}`;
                          return (
                            <option
                              key={sibling.id}
                              value={sibling.id}
                              disabled={Boolean(reason)}
                            >
                              {label}
                            </option>
                          );
                        })
                      )}
                    </select>
                    {selectedTarget ? (
                      <div className={styles.statusRow}>
                        <Badge
                          variant={poolStatusBadgeVariant(
                            resolvePoolStatus(selectedTarget),
                          )}
                        >
                          {poolStatusLabel(resolvePoolStatus(selectedTarget))}
                        </Badge>
                        <Text tone="dim">
                          {openSeatsFor(selectedTarget)} open seats on destination
                        </Text>
                      </div>
                    ) : null}
                  </div>
                )}
                {eligibleSiblings.length === 0 && !siblingsLoading ? (
                  <Text tone="muted" role="alert">
                    Link another claimable account with enough open seats first.
                  </Text>
                ) : null}
              </>
            ) : (
              <Text tone="dim">
                No occupied seats on this account. Unassign returns it to inventory
                immediately.
              </Text>
            )}
            <div className={styles.actionPanelActions}>
              <Button
                type="button"
                variant="secondary"
                disabled={unassignDisabled}
                onClick={() => void handleUnassign()}
                data-testid="admin-account-unassign"
              >
                {actionId === account.id ? 'Working…' : 'Unassign from game'}
              </Button>
            </div>
          </section>
        ) : (
          <section className={styles.actionPanel} aria-label="Game assignment">
            <div className={styles.actionPanelHeader}>
              <Text>Game assignment</Text>
              <Text tone="dim">
                This account is already in inventory and is not linked to a game.
              </Text>
            </div>
          </section>
        )}

        <AdminAccountDeleteSection
          disabled={account.activeUsersCount > 0 || busy}
          deleting={deleting}
          onDelete={() => void handleDelete()}
        />

        <div
          className={styles.editToolbar}
          data-testid="admin-account-edit-actions"
        >
          <div className={styles.editToolbarPrimary}>
            <Button
              type="submit"
              form="admin-account-edit-form"
              disabled={saving || deleting}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving || deleting}
              onClick={() => router.push('/admin/accounts')}
            >
              Cancel
            </Button>
          </div>
          <div className={styles.editToolbarSecondary}>
            {account.isActive ? (
              <Button
                type="button"
                variant="secondary"
                disabled={deactivateDisabled}
                onClick={() => void handleDeactivate()}
                data-testid="admin-account-deactivate"
              >
                {actionId === account.id ? 'Working…' : 'Deactivate'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void handleReactivate()}
              >
                {actionId === account.id ? 'Working…' : 'Reactivate'}
              </Button>
            )}
            {poolStatus === 'locked' ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void handleClearGuardLock()}
                data-testid="admin-account-clear-guard-lock"
              >
                Clear Steam Guard lock
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              onClick={() => router.push('/admin/accounts')}
            >
              Back to accounts
            </Button>
          </div>
        </div>
      </AdminPageShell>
    </Container>
  );
}
