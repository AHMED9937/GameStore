import Link from 'next/link';
import { Badge } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import {
  IconAvailable,
  IconEdit,
  IconPublish,
  IconSoldOut,
  IconUnpublish,
} from '../components/admin-action-icons';
import { AdminRowActionButton } from '../components/admin-row-action-button';
import {
  AdminSelectableRow,
  AdminSelectableTable,
} from '../components/admin-selectable-table';
import { ADMIN_GAME_COLUMNS } from './games.constants';
import type { AdminGameListItem } from './admin-games.types';
import type { AdminTableSelectionProps } from '../types/admin-table-selection';
import styles from './games.module.css';

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
        <div className={styles.tableActions}>
          <Link
            href={`/admin/games/${game.id}/edit`}
            aria-label={`Edit ${game.title}`}
            title={`Edit ${game.title}`}
          >
            <AdminRowActionButton
              variant="ghost"
              label={`Edit ${game.title}`}
              icon={<IconEdit />}
            />
          </Link>
          {onPublishToggle ? (
            <AdminRowActionButton
              label={`${game.published ? 'Unpublish' : 'Publish'} ${game.title}`}
              icon={game.published ? <IconUnpublish /> : <IconPublish />}
              disabled={isPublishing}
              onClick={() => onPublishToggle(game)}
            />
          ) : null}
          {onSoldOutToggle && game.published ? (
            game.soldOut && !game.soldOutManual ? (
              <AdminRowActionButton
                label={`No active pool for ${game.title}`}
                icon={<IconSoldOut />}
                disabled
              />
            ) : (
              <AdminRowActionButton
                label={`${game.soldOutManual ? 'Mark available' : 'Mark sold out'} ${game.title}`}
                icon={game.soldOutManual ? <IconAvailable /> : <IconSoldOut />}
                disabled={
                  isPublishing ||
                  (game.soldOutManual && !canMarkAvailable)
                }
                onClick={() => onSoldOutToggle(game)}
              />
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
            {renderRowCells(game, publishingId, onPublishToggle, onSoldOutToggle)}
          </AdminSelectableRow>
        ))}
      </AdminSelectableTable>
    </div>
  );
}
