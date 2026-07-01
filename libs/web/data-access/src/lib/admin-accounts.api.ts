import { apiGet, apiPost } from './api-client';
import type { SetupResponse } from './admin.types';

export type AdminAccountRecord = {
  id: string;
  gameId: string;
  gameTitle: string;
  username: string;
  platform: string;
  region: string;
  activeUsersCount: number;
  isActive: boolean;
};

export type CreateAdminAccountInput = {
  gameId: string;
  username: string;
  password: string;
  sharedSecret: string;
  region?: string;
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
