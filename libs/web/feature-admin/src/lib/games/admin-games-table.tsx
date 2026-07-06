import Link from 'next/link';
import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import {
  AdminSelectableRow,
  AdminSelectableTable,
} from '../components/admin-selectable-table';
import { ADMIN_GAME_COLUMNS } from './games.constants';
import type { AdminGameListItem } from './admin-games.types';
import type { AdminTableSelectionProps } from '../types/admin-table-selection';

export type AdminGamesTableProps = {
  games: AdminGameListItem[];
  publishingId?: string | null;
  onPublishToggle?: (game: AdminGameListItem) => void;
  onSoldOutToggle?: (game: AdminGameListItem) => void;
  selection?: AdminTableSelectionProps;
};

function statusBadge(game: AdminGameListItem) {
  if (game.published && game.soldOut) {
    return <Badge variant="default">Sold out</Badge>;
  }
  if (game.published) {
    return <Badge variant="success">Published</Badge>;
  }
  if (game.readinessLabel === 'Ready') {
    return <Badge variant="success">Ready</Badge>;
  }
  return <Badge variant="default">Draft</Badge>;
}

function renderRowCells(
  game: AdminGameListItem,
  publishingId: string | null,
  onPublishToggle?: (game: AdminGameListItem) => void,
  onSoldOutToggle?: (game: AdminGameListItem) => void,
) {
  const isPublishing = publishingId === game.id;
  const canMarkAvailable = game.published && game.hasActivePool;

  return (
    <>
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
      <td>
        {game.featuredOrder != null ? (
          <Badge variant="success">#{game.featuredOrder}</Badge>
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
          {onSoldOutToggle && game.published ? (
            game.soldOut && !game.soldOutManual ? (
              <Button type="button" variant="secondary" disabled>
                No active pool
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={
                  isPublishing ||
                  (game.soldOutManual && !canMarkAvailable)
                }
                onClick={() => onSoldOutToggle(game)}
              >
                {isPublishing
                  ? 'Saving…'
                  : game.soldOutManual
                    ? 'Mark available'
                    : 'Mark sold out'}
              </Button>
            )
          ) : null}
        </div>
      </td>
    </>
  );
}

export function AdminGamesTable({
  games,
  publishingId = null,
  onPublishToggle,
  onSoldOutToggle,
  selection,
}: AdminGamesTableProps) {
  if (!selection) {
    return (
      <div data-testid="admin-games-table">
        <AdminTable columns={[...ADMIN_GAME_COLUMNS]} caption="Admin games catalog">
          {games.map((game) => (
            <tr key={game.id}>
              {renderRowCells(game, publishingId, onPublishToggle, onSoldOutToggle)}
            </tr>
          ))}
        </AdminTable>
      </div>
    );
  }

  return (
    <div data-testid="admin-games-table">
      <AdminSelectableTable
        columns={[...ADMIN_GAME_COLUMNS]}
        caption="Admin games catalog"
        selectedCount={games.filter((game) => selection.isSelected(game.id)).length}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        onToggleAllVisible={selection.toggleAllVisible}
        selectionDisabled={selection.disabled}
      >
        {games.map((game) => (
          <AdminSelectableRow
            key={game.id}
            id={game.id}
            selected={selection.isSelected(game.id)}
            disabled={!selection.isRowSelectable(game.id) || selection.disabled}
            onToggle={selection.toggleRow}
          >
            {renderRowCells(game, publishingId, onPublishToggle)}
          </AdminSelectableRow>
        ))}
      </AdminSelectableTable>
    </div>
  );
}
