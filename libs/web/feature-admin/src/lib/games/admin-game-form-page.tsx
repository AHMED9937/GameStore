'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminGames } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminSetupState } from '../hooks/use-admin-resource';
import { AdminGameForm } from './admin-game-form';
import { AdminGameFormActions } from './admin-game-form-actions';
import type { AdminGameFormValues } from './admin-games.types';

export type AdminGameFormPageProps = {
  formState?: AdminAsyncState<AdminGameFormValues>;
};

export function AdminGameFormPage({ formState }: AdminGameFormPageProps) {
  const fetchedState = useAdminSetupState(() => getAdminGames());
  const state = formState ?? fetchedState;
  const values = state.status === 'success' ? state.data : undefined;

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="New game"
          description="Add a catalog title. IGDB import connects in a later slice."
        />
        {state.status !== 'success' ? (
          <AdminAsyncView state={state}>{() => null}</AdminAsyncView>
        ) : null}
        <AdminGameForm values={values} />
        <AdminGameFormActions />
      </AdminPageShell>
    </Container>
  );
}
