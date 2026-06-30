import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminGamesEmpty } from './admin-games-empty';
import { AdminGamesHeader } from './admin-games-header';
import { AdminGamesTable } from './admin-games-table';
import { AdminGamesToolbar } from './admin-games-toolbar';
import { ADMIN_GAMES_SETUP_MESSAGE } from './games.constants';
import type { AdminGameListItem } from './admin-games.types';

export type AdminGamesPageProps = {
  listState?: AdminAsyncState<AdminGameListItem[]>;
};

const DEFAULT_LIST_STATE: AdminAsyncState<AdminGameListItem[]> = {
  status: 'setup',
  message: ADMIN_GAMES_SETUP_MESSAGE,
};

export function AdminGamesPage({
  listState = DEFAULT_LIST_STATE,
}: AdminGamesPageProps) {
  return (
    <Container>
      <AdminPageShell>
        <AdminGamesHeader />
        <AdminGamesToolbar />
        <AdminAsyncView
          state={listState}
          emptyMessage="No games in catalog yet."
        >
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
