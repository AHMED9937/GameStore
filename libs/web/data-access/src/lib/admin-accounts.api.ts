import { apiDelete, apiGet, apiPost, apiPut } from './api-client';
import type { SetupResponse } from './admin.types';

export type AdminAccountRecord = {
  id: string;
  gameId: string;
  gameTitle: string;
  username: string;
  platform: string;
  region: string;
  activeUsersCount: number;
  maxActiveUsers: number;
  isActive: boolean;
};

export type CreateAdminAccountInput = {
  gameId: string;
  username: string;
  password: string;
  sharedSecret: string;
  region?: string;
  maxActiveUsers?: number;
};

export type UpdateAdminAccountInput = {
  username?: string;
  region?: string;
  password?: string;
  sharedSecret?: string;
  maxActiveUsers?: number;
};

export function getAdminAccounts(gameId?: string) {
  const query = gameId ? `?gameId=${encodeURIComponent(gameId)}` : '';
  return apiGet<SetupResponse | AdminAccountRecord[]>(`/admin/accounts${query}`);
}

export function getAdminAccount(id: string) {
  return apiGet<SetupResponse | AdminAccountRecord>(`/admin/accounts/${id}`);
}

export function createAdminAccount(body: CreateAdminAccountInput) {
  return apiPost<SetupResponse | AdminAccountRecord>('/admin/accounts', body);
}

export function deactivateAdminAccount(id: string) {
  return apiPost<SetupResponse | AdminAccountRecord>(
    `/admin/accounts/${id}/deactivate`,
  );
}

export function updateAdminAccount(id: string, body: UpdateAdminAccountInput) {
  return apiPut<SetupResponse | AdminAccountRecord>(`/admin/accounts/${id}`, body);
}

export function reactivateAdminAccount(id: string) {
  return apiPost<SetupResponse | AdminAccountRecord>(
    `/admin/accounts/${id}/reactivate`,
  );
}

export function deleteAdminAccount(id: string) {
  return apiDelete<SetupResponse | { id: string; deleted: true }>(
    `/admin/accounts/${id}`,
  );
}
