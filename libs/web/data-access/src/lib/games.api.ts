import { cache } from 'react';
import { apiGet } from './api-client';

export type Game = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  platform: string;
  /** Decimal serialized as string from the API */
  priceBase: string;
  coverImage: string | null;
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
  requirementsMin: string | null;
  requirementsRecommended: string | null;
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

export async function getGameBySlug(slug: string): Promise<GameDetail> {
  return apiGet<GameDetail>(`/games/${slug}`);
}
