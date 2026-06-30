'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminLicenses } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminSetupState } from '../hooks/use-admin-resource';
import { AdminLicenseForm } from './admin-license-form';
import { AdminLicenseFormActions } from './admin-license-form-actions';
import type { AdminLicenseFormValues } from './admin-licenses.types';

export type AdminLicenseFormPageProps = {
  formState?: AdminAsyncState<AdminLicenseFormValues>;
};

export function AdminLicenseFormPage({ formState }: AdminLicenseFormPageProps) {
  const fetchedState = useAdminSetupState(() => getAdminLicenses());
  const state = formState ?? fetchedState;
  const values = state.status === 'success' ? state.data : undefined;

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Issue license"
          description="Create activation keys for a catalog title."
        />
        {state.status !== 'success' ? (
          <AdminAsyncView state={state}>{() => null}</AdminAsyncView>
        ) : null}
        <AdminLicenseForm values={values} />
        <AdminLicenseFormActions />
      </AdminPageShell>
    </Container>
  );
}
