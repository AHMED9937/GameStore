import { apiDelete, apiGet, apiPost, apiPut } from './api-client';
import type { BulkActionResult, SetupResponse } from './admin.types';

export type AdminAccountRecord = {
  id: string;
  gameId: string | null;
  gameTitle: string | null;
  username: string;
  platform: string;
  region: string;
  activeUsersCount: number;
  maxActiveUsers: number;
  isActive: boolean;
};

export type CreateAdminAccountInput = {
  gameId?: string;
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

export type AdminAccountListFilters = {
  q?: string;
  status?: 'active' | 'inactive';
  platform?: string;
  gameId?: string;
};

export function getAdminAccounts(filters: AdminAccountListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set('q', filters.q);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.platform) {
    params.set('platform', filters.platform);
  }
  if (filters.gameId) {
    params.set('gameId', filters.gameId);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiGet<SetupResponse | AdminAccountRecord[]>(`/admin/accounts${suffix}`);
}

export function getAvailableAdminAccounts(query = '') {
  const params = query.trim()
    ? `?q=${encodeURIComponent(query.trim())}`
    : '';
  return apiGet<SetupResponse | AdminAccountRecord[]>(
    `/admin/accounts/available${params}`,
  );
}

export function getAdminAccount(id: string) {
  return apiGet<SetupResponse | AdminAccountRecord>(`/admin/accounts/${id}`);
}

export function createAdminAccount(body: CreateAdminAccountInput) {
  return apiPost<SetupResponse | AdminAccountRecord>('/admin/accounts', body);
}

export function assignAdminAccountToGame(accountId: string, gameId: string) {
  return apiPost<SetupResponse | AdminAccountRecord>(
    `/admin/accounts/${accountId}/assign`,
    { gameId },
  );
}

export function unassignAdminAccount(accountId: string) {
  return apiPost<SetupResponse | AdminAccountRecord>(
    `/admin/accounts/${accountId}/unassign`,
  );
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

export function bulkDeactivateAdminAccounts(ids: string[]) {
  return apiPost<SetupResponse | BulkActionResult>(
    '/admin/accounts/bulk-deactivate',
    { ids },
  );
}

export function bulkDeleteAdminAccounts(ids: string[]) {
  return apiPost<SetupResponse | BulkActionResult>(
    '/admin/accounts/bulk-delete',
    { ids },
  );
}
