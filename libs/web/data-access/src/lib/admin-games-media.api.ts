import { apiDelete, apiGet, apiPost, apiPut } from './api-client';
import type { SetupResponse } from './admin.types';
import type { AdminGameMediaRecord } from './admin-games.api';

export type CreateGameMediaInput = {
  type: string;
  url: string;
  title?: string;
  sortOrder?: number;
  igdbId?: number;
};

export function getAdminGameMedia(gameId: string) {
  return apiGet<SetupResponse | AdminGameMediaRecord[]>(
    `/admin/games/${gameId}/media`,
  );
}

export function createAdminGameMedia(
  gameId: string,
  body: CreateGameMediaInput,
) {
  return apiPost<SetupResponse | AdminGameMediaRecord>(
    `/admin/games/${gameId}/media`,
    body,
  );
}

export function updateAdminGameMedia(
  gameId: string,
  mediaId: string,
  body: Partial<CreateGameMediaInput>,
) {
  return apiPut<SetupResponse | AdminGameMediaRecord>(
    `/admin/games/${gameId}/media/${mediaId}`,
    body,
  );
}

export function deleteAdminGameMedia(gameId: string, mediaId: string) {
  return apiDelete<SetupResponse | { id: string; deleted: true }>(
    `/admin/games/${gameId}/media/${mediaId}`,
  );
}
