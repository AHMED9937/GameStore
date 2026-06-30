import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminGameDeleteSection } from './admin-game-delete-section';
import { AdminGameForm } from './admin-game-form';
import { AdminGameFormActions } from './admin-game-form-actions';
import { ADMIN_GAMES_SETUP_MESSAGE } from './games.constants';
import type { AdminGameFormValues } from './admin-games.types';

export type AdminGameEditPageProps = {
  gameId: string;
  formState?: AdminAsyncState<AdminGameFormValues>;
};

const DEFAULT_FORM_STATE: AdminAsyncState<AdminGameFormValues> = {
  status: 'setup',
  message: ADMIN_GAMES_SETUP_MESSAGE,
};

export function AdminGameEditPage({
  gameId,
  formState = DEFAULT_FORM_STATE,
}: AdminGameEditPageProps) {
  const values = formState.status === 'success' ? formState.data : undefined;

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Edit game"
          description={`Editing game ${gameId}. Publish and media sync connect in later slices.`}
        />
        {formState.status !== 'success' ? (
          <AdminAsyncView state={formState}>{() => null}</AdminAsyncView>
        ) : null}
        <AdminGameForm values={values} />
        <AdminGameFormActions cancelHref="/admin/games" />
        <AdminGameDeleteSection />
      </AdminPageShell>
    </Container>
  );
}
