import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminAccountForm } from './admin-account-form';
import { AdminAccountFormActions } from './admin-account-form-actions';
import type { AdminAccountFormValues } from './admin-accounts.types';
import { ADMIN_ACCOUNTS_SETUP_MESSAGE } from './accounts.constants';

export type AdminAccountFormPageProps = {
  formState?: AdminAsyncState<AdminAccountFormValues>;
};

const DEFAULT_FORM_STATE: AdminAsyncState<AdminAccountFormValues> = {
  status: 'setup',
  message: ADMIN_ACCOUNTS_SETUP_MESSAGE,
};

export function AdminAccountFormPage({
  formState = DEFAULT_FORM_STATE,
}: AdminAccountFormPageProps) {
  const values = formState.status === 'success' ? formState.data : undefined;

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
        <AdminAccountForm values={values} />
        <AdminAccountFormActions />
      </AdminPageShell>
    </Container>
  );
}
