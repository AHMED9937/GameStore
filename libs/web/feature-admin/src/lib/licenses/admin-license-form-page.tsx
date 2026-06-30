import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminLicenseForm } from './admin-license-form';
import { AdminLicenseFormActions } from './admin-license-form-actions';
import type { AdminLicenseFormValues } from './admin-licenses.types';
import { ADMIN_LICENSES_SETUP_MESSAGE } from './licenses.constants';

export type AdminLicenseFormPageProps = {
  formState?: AdminAsyncState<AdminLicenseFormValues>;
};

const DEFAULT_FORM_STATE: AdminAsyncState<AdminLicenseFormValues> = {
  status: 'setup',
  message: ADMIN_LICENSES_SETUP_MESSAGE,
};

export function AdminLicenseFormPage({
  formState = DEFAULT_FORM_STATE,
}: AdminLicenseFormPageProps) {
  const values = formState.status === 'success' ? formState.data : undefined;

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Issue license"
          description="Create activation keys for a catalog title."
        />
        {formState.status !== 'success' ? (
          <AdminAsyncView state={formState}>{() => null}</AdminAsyncView>
        ) : null}
        <AdminLicenseForm values={values} />
        <AdminLicenseFormActions />
      </AdminPageShell>
    </Container>
  );
}
