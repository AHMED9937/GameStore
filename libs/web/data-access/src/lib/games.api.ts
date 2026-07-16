import { cache } from 'react';
import type { GameSystemRequirements } from '@gamestore/shared/game-requirements';
import { apiGetPublic, type ApiPublicCacheOptions } from './api-client';

const PUBLIC_GAME_CACHE: ApiPublicCacheOptions = {
  revalidate: 60,
  tags: ['games'],
};

export type { GameSystemRequirements } from '@gamestore/shared/game-requirements';

export type GameDiscount = {
  percentOff: number;
  priceSale: string;
  endsAt: string;
  showCountdown: boolean;
};

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
  soldOut?: boolean;
  discount?: GameDiscount | null;
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
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  requirementsMin: GameSystemRequirements | null;
  requirementsRecommended: GameSystemRequirements | null;
  media: GameMedia[];
};

export function formatGamePrice(priceBase: string): string {
  const value = Number(priceBase);
  if (Number.isNaN(value)) {
    return priceBase;
  }
  if (value === 0) {
    return 'Free';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/** Client-side guard against stale ISR cache after endsAt. */
export function resolveActiveGameDiscount(
  game: { discount?: GameDiscount | null },
  now: Date | number = Date.now(),
): GameDiscount | null {
  const discount = game.discount;
  if (!discount) {
    return null;
  }
  const endsAtMs = new Date(discount.endsAt).getTime();
  if (!Number.isFinite(endsAtMs) || endsAtMs <= Number(now)) {
    return null;
  }
  return discount;
}

export function getGameDisplayPrice(game: {
  priceBase: string;
  discount?: GameDiscount | null;
}): { priceBase: string; priceSale: string | null; percentOff: number | null } {
  const active = resolveActiveGameDiscount(game);
  if (!active) {
    return { priceBase: game.priceBase, priceSale: null, percentOff: null };
  }
  return {
    priceBase: game.priceBase,
    priceSale: active.priceSale,
    percentOff: active.percentOff,
  };
}

export {
  formatDiscountCountdown,
  getDiscountCountdownUnits,
  type DiscountCountdownUnits,
} from '@gamestore/shared/pricing';

export const getGames = cache(async (): Promise<Game[]> => {
  return apiGetPublic<Game[]>('/games', PUBLIC_GAME_CACHE);
});

export const getFeaturedGames = cache(async (): Promise<Game[]> => {
  return apiGetPublic<Game[]>('/games/featured', PUBLIC_GAME_CACHE);
});

export function getGameCardCover(
  game: { coverCardImage?: string | null; coverImage?: string | null },
  fallback = '/og/default.png',
): string {
  return game.coverCardImage?.trim() || game.coverImage?.trim() || fallback;
}

export const getGameBySlug = cache(async (slug: string): Promise<GameDetail> => {
  return apiGetPublic<GameDetail>(`/games/${slug}`, {
    revalidate: PUBLIC_GAME_CACHE.revalidate,
    tags: [...(PUBLIC_GAME_CACHE.tags ?? []), `game:${slug}`],
  });
});
