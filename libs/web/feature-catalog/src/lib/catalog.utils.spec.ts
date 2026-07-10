import { describe, expect, it } from 'vitest';
import type { Game } from '@gamestore/web/data-access';
import { filterCatalogGames, normalizeCatalogPlatform } from './catalog.utils';

const games: Game[] = [
  {
    id: '1',
    slug: 'stellar-odyssey',
    title: 'Stellar Odyssey',
    description: 'Space adventure',
    platform: 'steam',
    priceBase: '9.99',
    coverImage: null,
  },
  {
    id: '2',
    slug: 'neon-rally',
    title: 'Neon Drift Rally',
    description: 'Racing game',
    platform: 'epic',
    priceBase: '14.99',
    coverImage: null,
  },
  {
    id: '3',
    slug: 'void-protocol',
    title: 'Void Protocol',
    description: null,
    platform: 'xbox',
    priceBase: '19.99',
    coverImage: null,
  },
];

describe('catalog.utils', () => {
  it('normalizes xbox to microsoft', () => {
    expect(normalizeCatalogPlatform('xbox')).toBe('microsoft');
  });

  it('Filters by platform', () => {
    expect(filterCatalogGames(games, '', 'steam')).toHaveLength(1);
    expect(filterCatalogGames(games, '', 'microsoft')).toHaveLength(1);
    expect(filterCatalogGames(games, '', 'epic')).toHaveLength(1);
    expect(filterCatalogGames(games, '', 'ubisoft')).toHaveLength(0);
  });

  it('Filters by search query across title and description', () => {
    expect(filterCatalogGames(games, 'rally', 'all')).toHaveLength(1);
    expect(filterCatalogGames(games, 'space', 'all')).toHaveLength(1);
    expect(filterCatalogGames(games, 'void', 'steam')).toHaveLength(0);
    expect(filterCatalogGames(games, 'void', 'microsoft')).toHaveLength(1);
  });

  it('returns all games when search is blank and filter is all', () => {
    expect(filterCatalogGames(games, '   ', 'all')).toHaveLength(3);
  });
});
