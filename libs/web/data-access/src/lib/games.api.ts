import { cache } from 'react';
import type { GameSystemRequirements } from '@gamestore/shared/game-requirements';
import { apiGet } from './api-client';

export type { GameSystemRequirements } from '@gamestore/shared/game-requirements';

export type Game = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  platform: string;
  /** Decimal serialized as string from the API */
  priceBase: string;
  coverImage: string | null;
  coverCardImage?: string | null;
};

export type GameMedia = {
  id: string;
  type: string;
  url: string;
  title: string | null;
  sortOrder: number;
};

export type GameDetail = Game & {
  genres: string[];
  releaseDate: string | null;
  requirementsMin: GameSystemRequirements | null;
  requirementsRecommended: GameSystemRequirements | null;
  media: GameMedia[];
};

export function formatGamePrice(priceBase: string): string {
  const value = Number(priceBase);
  if (Number.isNaN(value)) {
    return priceBase;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export const getGames = cache(async (): Promise<Game[]> => {
  return apiGet<Game[]>('/games');
});

export function getGameCardCover(
  game: Pick<Game, 'coverCardImage' | 'coverImage'>,
  fallback = '/og/default.png',
): string {
  return game.coverCardImage?.trim() || game.coverImage?.trim() || fallback;
}

export async function getGameBySlug(slug: string): Promise<GameDetail> {
  return apiGet<GameDetail>(`/games/${slug}`);
}
