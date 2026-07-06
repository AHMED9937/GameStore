'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Container } from '@gamestore/shared/ui';
import {
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
import { useAdminMutation } from '../hooks/use-admin-mutation';
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
    soldOut: game.soldOut,
    soldOutManual: game.soldOutManual,
    featuredOrder: game.featuredOrder,
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

export function AdminGamesPage({ listState }: AdminGamesPageProps) {
  const isControlled = listState !== undefined;
  const { state: fetchedState, refetch, isRefetching } = useAdminListState(
    () => getAdminGames(),
    parseGamesList,
  );
  const state = listState ?? fetchedState;
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const bulkMutation = useAdminMutation<BulkActionResult>();
  const publishMutation = useAdminMutation<AdminGameRecord>();

  const tableGames =
    state.status === 'success'
      ? state.data
      : state.status === 'empty'
        ? []
        : [];

  const rowIds = useMemo(() => tableGames.map((game) => game.id), [tableGames]);

  const selection = useAdminRowSelection({
    rowIds,
    isRowSelectable: () => true,
  });

  const handleBulkResult = useCallback(
    async (result: BulkActionResult, verb: string) => {
      setActionMessage(formatBulkActionSummary(result, verb));
      selection.clearSelection();
      bulkMutation.reset();
      if (!isControlled) {
        refetch();
      }
    },
    [bulkMutation, isControlled, refetch, selection],
  );

  const handleBulkUnpublish = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Unpublish ${selection.selectedIds.length} selected game(s)? All licenses for these games will be revoked.`,
      )
    ) {
      return;
    }
    setActionMessage(null);
    const result = await bulkMutation.mutate(() =>
      bulkUnpublishAdminGames(selection.selectedIds).then((response) => {
        if (isSetupResponse(response)) {
          throw new Error(response.message);
        }
        return response;
      }),
    );
    if (result) {
      await handleBulkResult(result, 'unpublished');
    }
  }, [bulkMutation, handleBulkResult, isControlled, selection.selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Delete ${selection.selectedIds.length} selected game(s)? Pending/failed orders will be removed, completed orders kept with snapshots, and all licenses/accounts deleted. This cannot be undone.`,
      )
    ) {
      return;
    }
    setActionMessage(null);
    const result = await bulkMutation.mutate(() =>
      bulkDeleteAdminGames(selection.selectedIds).then((response) => {
        if (isSetupResponse(response)) {
          throw new Error(response.message);
        }
        return response;
      }),
    );
    if (result) {
      await handleBulkResult(result, 'deleted');
    }
  }, [bulkMutation, handleBulkResult, isControlled, selection.selectedIds]);

  const handlePublishToggle = useCallback(
    async (game: AdminGameListItem) => {
      if (isControlled) {
        return;
      }

      setPublishingId(game.id);
      publishMutation.reset();

      const result = await publishMutation.mutate(() =>
        updateAdminGame(game.id, { published: !game.published }).then((response) => {
          if (isSetupResponse(response)) {
            throw new Error(response.message);
          }
          return response;
        }),
      );

      if (result) {
        refetch();
      }
      setPublishingId(null);
    },
    [isControlled, publishMutation, refetch],
  );

  const handleSoldOutToggle = useCallback(
    async (game: AdminGameListItem) => {
      if (isControlled) {
        return;
      }

      setPublishingId(game.id);
      publishMutation.reset();

      const result = await publishMutation.mutate(() =>
        updateAdminGame(game.id, { soldOut: !game.soldOutManual }).then(
          (response) => {
            if (isSetupResponse(response)) {
              throw new Error(response.message);
            }
            return response;
          },
        ),
      );

      if (result) {
        refetch();
      }
      setPublishingId(null);
    },
    [isControlled, publishMutation, refetch],
  );

  const actionError = bulkMutation.error ?? publishMutation.error;
  const bulkLoading = bulkMutation.status === 'pending';

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
        <AdminAsyncView
          state={state}
          emptyMessage="No games in catalog yet."
          onRetry={isControlled ? undefined : refetch}
          isRetrying={isRefetching}
        >
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
                  games={tableGames}
                  publishingId={publishingId}
                  onPublishToggle={isControlled ? undefined : handlePublishToggle}
                  onSoldOutToggle={isControlled ? undefined : handleSoldOutToggle}
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
