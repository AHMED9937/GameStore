import { apiGet, apiPost } from './api-client';
import type { SetupResponse } from './admin.types';

export function getAdminAccounts() {
  return apiGet<SetupResponse | unknown[]>('/admin/accounts');
}

export function getAdminAccount(id: string) {
  return apiGet<SetupResponse | Record<string, unknown>>(`/admin/accounts/${id}`);
}

export function createAdminAccount(body: unknown) {
  return apiPost<SetupResponse | Record<string, unknown>>('/admin/accounts', body);
}

export function deactivateAdminAccount(id: string) {
  return apiPost<SetupResponse | Record<string, unknown>>(
    `/admin/accounts/${id}/deactivate`,
  );
}
