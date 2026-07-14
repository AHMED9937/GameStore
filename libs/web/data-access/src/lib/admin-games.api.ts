import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './api-client';
import type { GameSystemRequirements } from '@gamestore/shared/game-requirements';
import type { BulkActionResult, SetupResponse } from './admin.types';

export type { GameSystemRequirements } from '@gamestore/shared/game-requirements';

export type AdminGameMediaRecord = {
  id: string;
  type: string;
  url: string;
  title: string | null;
  sortOrder: number;
  igdbId: number | null;
};

export type AdminGameAccountSummary = {
  total: number;
  active: number;
  hasActivePool: boolean;
};

export type AdminGameDiscord = {
  configured: boolean;
  posted: boolean;
  messageId: string | null;
  announceDescription: string | null;
};

export type AdminGameRecord = {
  id: string;
  title: string;
  slug: string;
  platform: string;
  priceBase: string;
  description: string | null;
  coverImage: string | null;
  coverCardImage: string | null;
  publishedAt: string | null;
  published: boolean;
  soldOut: boolean;
  soldOutManual: boolean;
  featuredOrder: number | null;
  nextAccountId: string | null;
  igdbId: number | null;
  igdbSyncedAt: string | null;
  igdbCoverUrl: string | null;
  releaseDate: string | null;
  genres: string[];
  requirementsMin: GameSystemRequirements | null;
  requirementsRecommended: GameSystemRequirements | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  media: AdminGameMediaRecord[];
  accountSummary: AdminGameAccountSummary;
  discord: AdminGameDiscord;
};

export type AdminGameInput = {
  title: string;
  slug: string;
  platform: string;
  priceBase: number | string;
  description?: string;
  coverImage?: string;
  published?: boolean;
  soldOut?: boolean;
  publishedAt?: string | null;
  genres?: string[];
  releaseDate?: string | null;
  requirementsMin?: GameSystemRequirements | null;
  requirementsRecommended?: GameSystemRequirements | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  discordAnnounceDescription?: string | null;
};

export type AdminReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
};

export type AdminGameReadiness = {
  ready: boolean;
  canPublish: boolean;
  checks: AdminReadinessCheck[];
};

export type AdminGameListFilters = {
  q?: string;
  platform?: string;
  status?: 'published' | 'draft' | 'sold_out';
};

export function getAdminGames(filters: AdminGameListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set('q', filters.q);
  }
  if (filters.platform) {
    params.set('platform', filters.platform);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiGet<SetupResponse | AdminGameRecord[]>(`/admin/games${suffix}`);
}

export function getAdminGame(id: string) {
  return apiGet<SetupResponse | AdminGameRecord>(`/admin/games/${id}`);
}

export function setAdminGameNextAccount(
  gameId: string,
  accountId: string | null,
) {
  return apiPatch<SetupResponse | AdminGameRecord>(
    `/admin/games/${gameId}/next-account`,
    { accountId },
  );
}

export function getAdminGameReadiness(id: string) {
  return apiGet<SetupResponse | AdminGameReadiness>(
    `/admin/games/${id}/readiness`,
  );
}

export function createAdminGame(body: AdminGameInput) {
  return apiPost<SetupResponse | AdminGameRecord>('/admin/games', body);
}

export function updateAdminGame(id: string, body: Partial<AdminGameInput>) {
  return apiPut<SetupResponse | AdminGameRecord>(`/admin/games/${id}`, body);
}

export function deleteAdminGame(id: string) {
  return apiDelete<SetupResponse | { id: string; deleted: true }>(
    `/admin/games/${id}`,
  );
}

export function bulkUnpublishAdminGames(ids: string[]) {
  return apiPost<SetupResponse | BulkActionResult>(
    '/admin/games/bulk-unpublish',
    { ids },
  );
}

export function bulkDeleteAdminGames(ids: string[]) {
  return apiPost<SetupResponse | BulkActionResult>(
    '/admin/games/bulk-delete',
    { ids },
  );
}

export type AdminFeaturedGameItem = {
  id: string;
  title: string;
  slug: string;
  platform: string;
  priceBase: string;
  coverImage: string | null;
  coverCardImage: string | null;
  featuredOrder: number | null;
  releaseDate: string | null;
};

export type AdminFeaturedGamesResponse = {
  featured: AdminFeaturedGameItem[];
  available: AdminFeaturedGameItem[];
};

export function getAdminFeaturedGames(q?: string) {
  const suffix = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return apiGet<SetupResponse | AdminFeaturedGamesResponse>(
    `/admin/games/featured${suffix}`,
  );
}

export function updateAdminFeaturedGames(gameIds: string[]) {
  return apiPut<SetupResponse | AdminFeaturedGamesResponse>(
    '/admin/games/featured',
    { gameIds },
  );
}
