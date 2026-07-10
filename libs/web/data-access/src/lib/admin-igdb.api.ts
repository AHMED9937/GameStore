import { apiGet, apiPost } from './api-client';
import type { SetupResponse } from './admin.types';

export type AdminIgdbHealth = {
  integration: string;
  configured: boolean;
};

export type AdminIgdbSearchResult = {
  igdbId: number;
  title: string;
  releaseDate: string | null;
  coverUrl: string | null;
};

export type AdminIgdbImportedGame = {
  id: string;
  slug: string;
  title: string;
  igdbId: number;
  platform: string;
  priceBase: string;
  publishedAt: string | null;
};

export type AdminIgdbImportResponse = {
  game: AdminIgdbImportedGame;
  updated?: boolean;
};

export function getAdminIgdbHealth() {
  return apiGet<AdminIgdbHealth>('/admin/igdb/health');
}

export function searchAdminIgdb(query: string) {
  const params = new URLSearchParams({ q: query });
  return apiGet<SetupResponse | AdminIgdbSearchResult[]>(
    `/admin/igdb/search?${params.toString()}`,
  );
}

export function importAdminIgdbGame(input: {
  igdbId: number;
  priceBase?: number;
  platform?: string;
  slug?: string;
}) {
  return apiPost<SetupResponse | AdminIgdbImportResponse>('/admin/igdb/import', {
    igdbId: input.igdbId,
    priceBase: input.priceBase ?? 9.99,
    platform: input.platform ?? 'steam',
    slug: input.slug,
  });
}

export function syncAdminGameFromIgdb(gameId: string) {
  return apiPost<SetupResponse | AdminIgdbImportResponse>(
    `/admin/games/${encodeURIComponent(gameId)}/sync-igdb`,
  );
}
