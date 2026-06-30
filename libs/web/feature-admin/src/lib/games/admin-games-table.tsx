import Link from 'next/link';
import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import { ADMIN_GAME_COLUMNS } from './games.constants';
import type { AdminGameListItem } from './admin-games.types';

export type AdminGamesTableProps = {
  games: AdminGameListItem[];
};

export function AdminGamesTable({ games }: AdminGamesTableProps) {
  return (
    <div data-testid="admin-games-table">
    <AdminTable columns={[...ADMIN_GAME_COLUMNS]} caption="Admin games catalog">
      {games.map((game) => (
        <tr key={game.id}>
          <td>{game.title}</td>
          <td>{game.slug}</td>
          <td>{game.platform}</td>
          <td>
            <Badge variant={game.published ? 'success' : 'default'}>
              {game.published ? 'Published' : 'Draft'}
            </Badge>
          </td>
          <td>
            <Link href={`/admin/games/${game.id}/edit`}>
              <Button type="button" variant="ghost">
                Edit
              </Button>
            </Link>
          </td>
        </tr>
      ))}
    </AdminTable>
    </div>
  );
}
