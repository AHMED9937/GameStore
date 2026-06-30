import { apiGet, apiPost } from './api-client';
import type { SetupResponse } from './admin.types';

export function getAdminLicenses() {
  return apiGet<SetupResponse | unknown[]>('/admin/licenses');
}

export function getAdminLicense(id: string) {
  return apiGet<SetupResponse | Record<string, unknown>>(`/admin/licenses/${id}`);
}

export function createAdminLicense(body: unknown) {
  return apiPost<SetupResponse | Record<string, unknown>>('/admin/licenses', body);
}

export function generateAdminLicenseKey(body?: unknown) {
  return apiPost<SetupResponse | Record<string, unknown>>(
    '/admin/licenses/generate-key',
    body,
  );
}

export function revokeAdminLicense(id: string) {
  return apiPost<SetupResponse | Record<string, unknown>>(`/admin/licenses/${id}/revoke`);
}
