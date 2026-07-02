'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Container, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  deactivateAdminAccount,
  deleteAdminAccount,
  getAdminAccount,
  isSetupResponse,
  reactivateAdminAccount,
  updateAdminAccount,
  type AdminAccountRecord,
} from '@gamestore/web/data-access';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import { AdminAccountDeleteSection } from './admin-account-delete-section';
import { AdminAccountForm } from './admin-account-form';
import { AdminAccountFormActions } from './admin-account-form-actions';
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
    gameId: account.gameId,
    gameTitle: account.gameTitle,
    username: account.username,
    platform: account.platform,
    region: account.region,
    maxActiveUsers: String(account.maxActiveUsers),
    password: '',
    sharedSecret: '',
  };
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

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!account) {
        return;
      }
      if (!values.username.trim()) {
        setError('Username is required.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const payload = {
          username: values.username.trim(),
          region: values.region.trim() || 'global',
          maxActiveUsers: Number.parseInt(values.maxActiveUsers, 10),
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
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [account, values],
  );

  const handleDeactivate = useCallback(async () => {
    if (!account || !window.confirm('Deactivate this pool account?')) {
      return;
    }
    setActionId(account.id);
    setError(null);
    try {
      const result = await deactivateAdminAccount(account.id);
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }
      setAccount(result);
      setValues(toFormValues(result));
    } catch (actionError: unknown) {
      setError(apiErrorMessage(actionError));
    } finally {
      setActionId(null);
    }
  }, [account]);

  const handleReactivate = useCallback(async () => {
    if (!account || !window.confirm('Reactivate this pool account?')) {
      return;
    }
    setActionId(account.id);
    setError(null);
    try {
      const result = await reactivateAdminAccount(account.id);
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }
      setAccount(result);
      setValues(toFormValues(result));
    } catch (actionError: unknown) {
      setError(apiErrorMessage(actionError));
    } finally {
      setActionId(null);
    }
  }, [account]);

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
          <Text tone="dim">Loading account…</Text>
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

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Edit account"
          description="Update pool credentials or deactivate this Steam account."
        />
        <div className={styles.statusRow} data-testid="admin-account-edit-status">
          <Badge variant={account.isActive ? 'success' : 'default'}>
            {account.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Text tone="muted">
            {account.activeUsersCount} / {account.maxActiveUsers} active users
          </Text>
          <Link href={`/admin/games/${account.gameId}/edit`}>
            <Text tone="muted">Open game edit</Text>
          </Link>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <AdminAccountForm
            mode="edit"
            values={values}
            disabled={saving || actionId !== null || deleting}
            onValuesChange={setValues}
          />
          {error ? (
            <div className={styles.formMessage} role="alert" data-testid="admin-account-edit-error">
              <Text tone="muted">{error}</Text>
            </div>
          ) : null}
          <AdminAccountFormActions saving={saving || deleting} submitLabel="Save changes" />
        </form>
        <div className={styles.secondaryActions}>
          {account.isActive ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving || actionId !== null || deleting}
              onClick={() => void handleDeactivate()}
            >
              {actionId === account.id ? 'Saving…' : 'Deactivate'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={saving || actionId !== null || deleting}
              onClick={() => void handleReactivate()}
            >
              {actionId === account.id ? 'Saving…' : 'Reactivate'}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={deleting}
            onClick={() => router.push('/admin/accounts')}
          >
            Back to accounts
          </Button>
        </div>
        <AdminAccountDeleteSection
          disabled={account.activeUsersCount > 0 || saving || actionId !== null}
          deleting={deleting}
          onDelete={() => void handleDelete()}
        />
      </AdminPageShell>
    </Container>
  );
}
