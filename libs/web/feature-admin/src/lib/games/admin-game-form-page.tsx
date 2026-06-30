import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminGameForm } from './admin-game-form';
import { AdminGameFormActions } from './admin-game-form-actions';
import { ADMIN_GAMES_SETUP_MESSAGE } from './games.constants';
import type { AdminGameFormValues } from './admin-games.types';

export type AdminGameFormPageProps = {
  formState?: AdminAsyncState<AdminGameFormValues>;
};

const DEFAULT_FORM_STATE: AdminAsyncState<AdminGameFormValues> = {
  status: 'setup',
  message: ADMIN_GAMES_SETUP_MESSAGE,
};

export function AdminGameFormPage({
  formState = DEFAULT_FORM_STATE,
}: AdminGameFormPageProps) {
  const values = formState.status === 'success' ? formState.data : undefined;

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="New game"
          description="Add a catalog title. IGDB import connects in a later slice."
        />
        {formState.status !== 'success' ? (
          <AdminAsyncView state={formState}>{() => null}</AdminAsyncView>
        ) : null}
        <AdminGameForm values={values} />
        <AdminGameFormActions />
      </AdminPageShell>
    </Container>
  );
}
