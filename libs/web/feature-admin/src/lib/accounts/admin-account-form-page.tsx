'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminAccounts } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminSetupState } from '../hooks/use-admin-resource';
import { AdminAccountForm } from './admin-account-form';
import { AdminAccountFormActions } from './admin-account-form-actions';
import type { AdminAccountFormValues } from './admin-accounts.types';

export type AdminAccountFormPageProps = {
  formState?: AdminAsyncState<AdminAccountFormValues>;
};

export function AdminAccountFormPage({ formState }: AdminAccountFormPageProps) {
  const fetchedState = useAdminSetupState(() => getAdminAccounts());
  const state = formState ?? fetchedState;
  const values = state.status === 'success' ? state.data : undefined;

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Add account"
          description="Register a Steam pool account. Credentials are encrypted at rest."
        />
        {state.status !== 'success' ? (
          <AdminAsyncView state={state}>{() => null}</AdminAsyncView>
        ) : null}
        <AdminAccountForm values={values} />
        <AdminAccountFormActions />
      </AdminPageShell>
    </Container>
  );
}
