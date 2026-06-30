'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminGame } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import { AdminGameDeleteSection } from './admin-game-delete-section';
import { AdminGameForm } from './admin-game-form';
import { AdminGameFormActions } from './admin-game-form-actions';
import type { AdminGameFormValues } from './admin-games.types';

export type AdminGameEditPageProps = {
  gameId: string;
  formState?: AdminAsyncState<AdminGameFormValues>;
};

function parseGameForm(data: unknown): AdminGameFormValues {
  const record = data as Record<string, unknown>;
  return {
    title: String(record.title ?? ''),
    slug: String(record.slug ?? ''),
    platform: String(record.platform ?? ''),
    description: String(record.description ?? ''),
    priceBase: String(record.priceBase ?? ''),
  };
}

export function AdminGameEditPage({ gameId, formState }: AdminGameEditPageProps) {
  const fetchedState = useAdminResourceState(
    () => getAdminGame(gameId),
    parseGameForm,
    { deps: [gameId] },
  );
  const state = formState ?? fetchedState;
  const values = state.status === 'success' ? state.data : undefined;

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Edit game"
          description={`Editing game ${gameId}. Publish and media sync connect in later slices.`}
        />
        {state.status !== 'success' ? (
          <AdminAsyncView state={state}>{() => null}</AdminAsyncView>
        ) : null}
        <AdminGameForm values={values} />
        <AdminGameFormActions cancelHref="/admin/games" />
        <AdminGameDeleteSection />
      </AdminPageShell>
    </Container>
  );
}
