'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  bulkDeleteAdminGames,
  bulkUnpublishAdminGames,
  getAdminGames,
  isSetupResponse,
  updateAdminGame,
  type AdminGameRecord,
  type BulkActionResult,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminBulkToolbar } from '../components/admin-bulk-toolbar';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminRowSelection } from '../components/use-admin-row-selection';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { formatBulkActionSummary } from '../utils/bulk-action-summary';
import { AdminGamesEmpty } from './admin-games-empty';
import { AdminGamesHeader } from './admin-games-header';
import { AdminGamesTable } from './admin-games-table';
import { AdminGamesToolbar } from './admin-games-toolbar';
import type { AdminGameListItem } from './admin-games.types';

export type AdminGamesPageProps = {
  listState?: AdminAsyncState<AdminGameListItem[]>;
};

function toListItem(game: AdminGameRecord): AdminGameListItem {
  const hasActivePool = game.accountSummary.hasActivePool;
  const readinessLabel: AdminGameListItem['readinessLabel'] = game.published
    ? 'Published'
    : hasActivePool &&
        Boolean(game.coverImage?.trim()) &&
        game.genres.length >= 1 &&
        (game.description?.trim().length ?? 0) >= 50
      ? 'Ready'
      : 'Draft';

  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    platform: game.platform,
    priceBase: game.priceBase,
    published: game.published,
    igdbId: game.igdbId,
    hasActivePool,
    readinessLabel,
  };
}

function parseGamesList(data: unknown): AdminGameListItem[] {
  return Array.isArray(data)
    ? (data as AdminGameRecord[]).map(toListItem)
    : [];
}

async function reloadGames(): Promise<AdminGameListItem[]> {
  const result = await getAdminGames();
  if (isSetupResponse(result)) {
    return [];
  }
  return parseGamesList(result);
}

export function AdminGamesPage({ listState }: AdminGamesPageProps) {
  const isControlled = listState !== undefined;
  const fetchedState = useAdminListState(() => getAdminGames(), parseGamesList);
  const state = listState ?? fetchedState;
  const [games, setGames] = useState<AdminGameListItem[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setGames(state.data);
    }
  }, [isControlled, state]);

  const tableGames =
    isControlled && state.status === 'success' ? state.data : games;

  const rowIds = useMemo(() => tableGames.map((game) => game.id), [tableGames]);

  const selection = useAdminRowSelection({
    rowIds,
    isRowSelectable: () => true,
  });

  const refreshList = useCallback(async () => {
    if (isControlled) {
      return;
    }
    const rows = await reloadGames();
    setGames(rows);
  }, [isControlled]);

  const handleBulkResult = useCallback(
    async (result: BulkActionResult, verb: string) => {
      setActionMessage(formatBulkActionSummary(result, verb));
      selection.clearSelection();
      await refreshList();
    },
    [refreshList, selection],
  );

  const handleBulkUnpublish = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Unpublish ${selection.selectedIds.length} selected game(s)?`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await bulkUnpublishAdminGames(selection.selectedIds);
      if (isSetupResponse(result)) {
        setActionError(result.message);
        return;
      }
      await handleBulkResult(result, 'unpublished');
    } catch (error: unknown) {
      setActionError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [handleBulkResult, isControlled, selection.selectedIds, selection]);

  const handleBulkDelete = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Delete ${selection.selectedIds.length} selected game(s)? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await bulkDeleteAdminGames(selection.selectedIds);
      if (isSetupResponse(result)) {
        setActionError(result.message);
        return;
      }
      await handleBulkResult(result, 'deleted');
    } catch (error: unknown) {
      setActionError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [handleBulkResult, isControlled, selection.selectedIds, selection]);

  const handlePublishToggle = useCallback(
    async (game: AdminGameListItem) => {
      if (isControlled) {
        return;
      }

      setPublishingId(game.id);
      setActionError(null);

      try {
        const result = await updateAdminGame(game.id, {
          published: !game.published,
        });

        if (isSetupResponse(result)) {
          setActionError(result.message);
          return;
        }

        setGames((current) =>
          current.map((item) => (item.id === game.id ? toListItem(result) : item)),
        );
      } catch (error: unknown) {
        setActionError(apiErrorMessage(error));
      } finally {
        setPublishingId(null);
      }
    },
    [isControlled],
  );

  return (
    <Container>
      <AdminPageShell>
        <AdminGamesHeader />
        <AdminGamesToolbar />
        {actionError ? (
          <p role="alert" data-testid="admin-games-action-error">
            {actionError}
          </p>
        ) : null}
        {actionMessage ? (
          <p data-testid="admin-games-action-message">{actionMessage}</p>
        ) : null}
        <AdminAsyncView state={state} emptyMessage="No games in catalog yet.">
          {(items) =>
            items.length === 0 ? (
              <AdminGamesEmpty />
            ) : (
              <>
                {!isControlled ? (
                  <AdminBulkToolbar
                    selectedCount={selection.selectedCount}
                    onClear={selection.clearSelection}
                    disabled={bulkLoading}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={bulkLoading}
                      onClick={() => void handleBulkUnpublish()}
                    >
                      Unpublish selected
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={bulkLoading}
                      onClick={() => void handleBulkDelete()}
                    >
                      Delete selected
                    </Button>
                  </AdminBulkToolbar>
                ) : null}
                <AdminGamesTable
                  games={tableGames.length > 0 ? tableGames : items}
                  publishingId={publishingId}
                  onPublishToggle={isControlled ? undefined : handlePublishToggle}
                  selection={
                    isControlled
                      ? undefined
                      : {
                          ...selection,
                          disabled: bulkLoading,
                        }
                  }
                />
              </>
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
