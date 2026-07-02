import Link from 'next/link';
import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import { ADMIN_GAME_COLUMNS } from './games.constants';
import type { AdminGameListItem } from './admin-games.types';

export type AdminGamesTableProps = {
  games: AdminGameListItem[];
  publishingId?: string | null;
  onPublishToggle?: (game: AdminGameListItem) => void;
};

function statusBadge(game: AdminGameListItem) {
  if (game.published) {
    return <Badge variant="success">Published</Badge>;
  }
  if (game.readinessLabel === 'Ready') {
    return <Badge variant="success">Ready</Badge>;
  }
  return <Badge variant="default">Draft</Badge>;
}

export function AdminGamesTable({
  games,
  publishingId = null,
  onPublishToggle,
}: AdminGamesTableProps) {
  return (
    <div data-testid="admin-games-table">
      <AdminTable columns={[...ADMIN_GAME_COLUMNS]} caption="Admin games catalog">
        {games.map((game) => {
          const isPublishing = publishingId === game.id;

          return (
            <tr key={game.id}>
              <td>{game.title}</td>
              <td>{game.slug}</td>
              <td>{game.platform}</td>
              <td>${game.priceBase}</td>
              <td>
                {game.hasActivePool ? (
                  <Badge variant="success">Active pool</Badge>
                ) : (
                  '—'
                )}
              </td>
              <td>{statusBadge(game)}</td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <Link href={`/admin/games/${game.id}/edit`}>
                    <Button type="button" variant="ghost">
                      Edit
                    </Button>
                  </Link>
                  {onPublishToggle ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isPublishing}
                      onClick={() => onPublishToggle(game)}
                    >
                      {isPublishing
                        ? 'Saving…'
                        : game.published
                          ? 'Unpublish'
                          : 'Publish'}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
