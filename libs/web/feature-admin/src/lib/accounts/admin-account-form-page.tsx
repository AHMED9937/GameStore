'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  createAdminAccount,
  isSetupResponse,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminAccountForm } from './admin-account-form';
import { AdminAccountFormActions } from './admin-account-form-actions';
import {
  EMPTY_ADMIN_ACCOUNT_FORM_VALUES,
  type AdminAccountFormValues,
} from './admin-accounts.types';
import styles from './accounts.module.css';

export type AdminAccountFormPageProps = {
  formState?: AdminAsyncState<AdminAccountFormValues>;
};

export function AdminAccountFormPage({ formState }: AdminAccountFormPageProps) {
  const router = useRouter();
  const isControlled = formState !== undefined;
  const [values, setValues] = useState<AdminAccountFormValues>(
    EMPTY_ADMIN_ACCOUNT_FORM_VALUES,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controlledValues =
    formState?.status === 'success'
      ? formState.data
      : EMPTY_ADMIN_ACCOUNT_FORM_VALUES;

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isControlled) {
        return;
      }
      if (!values.gameId) {
        setError('Select a Steam game first.');
        return;
      }
      if (!values.username.trim() || !values.password.trim() || !values.sharedSecret.trim()) {
        setError('Username, password, and shared secret are required.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const maxActiveUsers = Number.parseInt(values.maxActiveUsers, 10);
        const result = await createAdminAccount({
          gameId: values.gameId,
          username: values.username.trim(),
          password: values.password.trim(),
          sharedSecret: values.sharedSecret.trim(),
          region: values.region.trim() || 'global',
          ...(Number.isInteger(maxActiveUsers) && maxActiveUsers > 0
            ? { maxActiveUsers }
            : {}),
        });

        if (isSetupResponse(result)) {
          setError(result.message);
          return;
        }

        router.push(`/admin/accounts/${result.id}`);
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [isControlled, router, values],
  );

  if (isControlled) {
    return (
      <Container>
        <AdminPageShell>
          <AdminPageHeader
            title="Add account"
            description="Register a Steam pool account. Credentials are encrypted at rest."
          />
          {formState.status !== 'success' ? (
            <AdminAsyncView state={formState}>{() => null}</AdminAsyncView>
          ) : null}
          <AdminAccountForm
            mode="create"
            values={controlledValues}
            disabled={formState.status !== 'success'}
          />
          <AdminAccountFormActions />
        </AdminPageShell>
      </Container>
    );
  }

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Add account"
          description="Register a Steam pool account. Credentials are encrypted at rest."
        />
        <form onSubmit={(event) => void handleSubmit(event)}>
          <AdminAccountForm
            mode="create"
            values={values}
            disabled={saving}
            onValuesChange={setValues}
          />
          {error ? (
            <div className={styles.formMessage} role="alert" data-testid="admin-account-form-error">
              <Text tone="muted">{error}</Text>
            </div>
          ) : null}
          <AdminAccountFormActions saving={saving} />
        </form>
      </AdminPageShell>
    </Container>
  );
}
