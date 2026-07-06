import type { Game } from '@gamestore/web/data-access';
import type { CatalogPlatformFilter } from './catalog.constants';

export function normalizeCatalogPlatform(platform: string): string {
  const value = platform.trim().toLowerCase();
  if (value === 'xbox') {
    return 'microsoft';
  }
  return value;
}

export function matchesCatalogPlatform(
  gamePlatform: string,
  filter: CatalogPlatformFilter,
): boolean {
  if (filter === 'all') {
    return true;
  }

  return normalizeCatalogPlatform(gamePlatform) === filter;
}

export function matchesCatalogSearch(game: Game, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }

  const haystack = [game.title, game.slug, game.platform, game.description ?? '']
    .join(' ')
    .toLowerCase();

  return haystack.includes(trimmed);
}

export function filterCatalogGames(
  games: Game[],
  query: string,
  platformFilter: CatalogPlatformFilter,
): Game[] {
  return games.filter(
    (game) =>
      matchesCatalogPlatform(game.platform, platformFilter) &&
      matchesCatalogSearch(game, query),
  );
}
