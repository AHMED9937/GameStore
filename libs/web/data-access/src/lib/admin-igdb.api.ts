import { apiGet, apiPost } from './api-client';
import type { SetupResponse } from './admin.types';

export function searchAdminIgdb(query: string) {
  const params = new URLSearchParams({ q: query });
  return apiGet<SetupResponse | unknown[]>(`/admin/igdb/search?${params.toString()}`);
}

export function importAdminIgdbGame(igdbId: number) {
  return apiPost<SetupResponse | Record<string, unknown>>('/admin/igdb/import', {
    igdbId,
  });
}
