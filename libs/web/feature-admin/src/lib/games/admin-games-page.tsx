'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminGames } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { AdminGamesEmpty } from './admin-games-empty';
import { AdminGamesHeader } from './admin-games-header';
import { AdminGamesTable } from './admin-games-table';
import { AdminGamesToolbar } from './admin-games-toolbar';
import type { AdminGameListItem } from './admin-games.types';

export type AdminGamesPageProps = {
  listState?: AdminAsyncState<AdminGameListItem[]>;
};

function parseGamesList(data: unknown): AdminGameListItem[] {
  return Array.isArray(data) ? (data as AdminGameListItem[]) : [];
}

export function AdminGamesPage({ listState }: AdminGamesPageProps) {
  const fetchedState = useAdminListState(() => getAdminGames(), parseGamesList);
  const state = listState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminGamesHeader />
        <AdminGamesToolbar />
        <AdminAsyncView state={state} emptyMessage="No games in catalog yet.">
          {(games) =>
            games.length === 0 ? (
              <AdminGamesEmpty />
            ) : (
              <AdminGamesTable games={games} />
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
