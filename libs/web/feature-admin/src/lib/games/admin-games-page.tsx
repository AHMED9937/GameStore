'use client';

import { useCallback, useEffect, useState } from 'react';
import { Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  getAdminGames,
  isSetupResponse,
  updateAdminGame,
  type AdminGameRecord,
} from '@gamestore/web/data-access';
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

export function AdminGamesPage({ listState }: AdminGamesPageProps) {
  const isControlled = listState !== undefined;
  const fetchedState = useAdminListState(() => getAdminGames(), parseGamesList);
  const state = listState ?? fetchedState;
  const [games, setGames] = useState<AdminGameListItem[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setGames(state.data);
    }
  }, [isControlled, state]);

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

  const tableGames =
    isControlled && state.status === 'success' ? state.data : games;

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
        <AdminAsyncView state={state} emptyMessage="No games in catalog yet.">
          {(items) =>
            items.length === 0 ? (
              <AdminGamesEmpty />
            ) : (
              <AdminGamesTable
                games={tableGames.length > 0 ? tableGames : items}
                publishingId={publishingId}
                onPublishToggle={isControlled ? undefined : handlePublishToggle}
              />
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
