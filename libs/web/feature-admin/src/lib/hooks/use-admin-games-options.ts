'use client';

import { useEffect, useState } from 'react';
import {
  getAdminGames,
  isSetupResponse,
  type AdminGameRecord,
} from '@gamestore/web/data-access';

export type AdminGameOption = {
  id: string;
  title: string;
  slug: string;
};

export type AdminGamesFilter = 'all' | 'steam' | 'published';

function filterGames(
  games: AdminGameRecord[],
  gameFilter: AdminGamesFilter,
): AdminGameOption[] {
  const filtered =
    gameFilter === 'steam'
      ? games.filter((game) => game.platform === 'steam')
      : gameFilter === 'published'
        ? games.filter((game) => game.published)
        : games;

  return filtered
    .map((game) => ({
      id: game.id,
      title: game.title,
      slug: game.slug,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function useAdminGamesOptions(
  gameFilter: AdminGamesFilter = 'all',
  enabled = true,
) {
  const [games, setGames] = useState<AdminGameOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void getAdminGames()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (isSetupResponse(result) || !Array.isArray(result)) {
          setGames([]);
          return;
        }
        setGames(filterGames(result, gameFilter));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, gameFilter]);

  return { games, loading };
}

export function matchesGameSearch(
  game: AdminGameOption,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    game.title.toLowerCase().includes(normalized) ||
    game.slug.toLowerCase().includes(normalized)
  );
}
