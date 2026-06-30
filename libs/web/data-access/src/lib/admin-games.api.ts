import { apiDelete, apiGet, apiPost, apiPut } from './api-client';
import type { SetupResponse } from './admin.types';

export function getAdminGames() {
  return apiGet<SetupResponse | unknown[]>('/admin/games');
}

export function getAdminGame(id: string) {
  return apiGet<SetupResponse | Record<string, unknown>>(`/admin/games/${id}`);
}

export function createAdminGame(body: unknown) {
  return apiPost<SetupResponse | Record<string, unknown>>('/admin/games', body);
}

export function updateAdminGame(id: string, body: unknown) {
  return apiPut<SetupResponse | Record<string, unknown>>(`/admin/games/${id}`, body);
}

export function deleteAdminGame(id: string) {
  return apiDelete<SetupResponse | Record<string, unknown>>(`/admin/games/${id}`);
}
