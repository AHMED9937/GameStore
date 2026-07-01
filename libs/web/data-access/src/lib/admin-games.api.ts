import { apiDelete, apiGet, apiPost, apiPut } from './api-client';
import type { SetupResponse } from './admin.types';

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

export type AdminGameRecord = {
  id: string;
  title: string;
  slug: string;
  platform: string;
  priceBase: string;
  description: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  published: boolean;
  igdbId: number | null;
  releaseDate: string | null;
  genres: string[];
  requirementsMin: string | null;
  requirementsRecommended: string | null;
  media: AdminGameMediaRecord[];
  accountSummary: AdminGameAccountSummary;
};

export type AdminGameInput = {
  title: string;
  slug: string;
  platform: string;
  priceBase: number | string;
  description?: string;
  coverImage?: string;
  published?: boolean;
  publishedAt?: string | null;
  genres?: string[];
  releaseDate?: string | null;
  requirementsMin?: string | null;
  requirementsRecommended?: string | null;
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

export function getAdminGames() {
  return apiGet<SetupResponse | AdminGameRecord[]>('/admin/games');
}

export function getAdminGame(id: string) {
  return apiGet<SetupResponse | AdminGameRecord>(`/admin/games/${id}`);
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
