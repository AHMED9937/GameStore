import { apiDelete, apiGet, apiPost, apiPut } from './api-client';
import type { BulkActionResult, SetupResponse } from './admin.types';

export type AdminLicenseRecord = {
  id: string;
  licenseKey: string;
  gameId: string;
  gameTitle: string;
  status: string;
  source: string;
  subscriptionId: string | null;
  validFrom: string;
  expiresAt: string | null;
  buyerEmail: string | null;
  buyerCountry: string | null;
  ownerEmail: string | null;
  createdAt: string;
  activatedAt: string | null;
};

export type AdminLicenseListRecord = {
  id: string;
  licenseKeyMasked: string;
  gameTitle: string;
  ownerEmail: string | null;
  status: string;
  source: string;
  expiresAt: string | null;
};

export type AdminLicenseListFilters = {
  game?: string;
  source?: string;
  owner?: string;
  status?: string;
  expires?: 'lifetime' | 'expiring' | 'expired';
};

export type CreateAdminLicenseInput = {
  gameId: string;
  licenseKey?: string;
  buyerEmail?: string;
  buyerCountry?: string;
  quantity?: number;
};

export type GenerateAdminLicenseInput = {
  gameId: string;
  buyerEmail?: string;
  buyerCountry?: string;
};

export type UpdateAdminLicenseInput = {
  buyerEmail?: string;
  buyerCountry?: string;
  expiresAt?: string | null;
};

export function getAdminLicenses(Filters?: AdminLicenseListFilters) {
  const query = new URLSearchParams();
  if (Filters?.game) query.set('game', Filters.game);
  if (Filters?.source) query.set('source', Filters.source);
  if (Filters?.owner) query.set('owner', Filters.owner);
  if (Filters?.status) query.set('status', Filters.status);
  if (Filters?.expires) query.set('expires', Filters.expires);
  const queryString = query.toString();
  const path = queryString ? `/admin/licenses?${queryString}` : '/admin/licenses';
  return apiGet<SetupResponse | AdminLicenseListRecord[]>(path);
}

export function getAdminLicense(id: string) {
  return apiGet<SetupResponse | AdminLicenseRecord>(`/admin/licenses/${id}`);
}

export function createAdminLicense(body: CreateAdminLicenseInput) {
  return apiPost<SetupResponse | AdminLicenseRecord | { licenses: AdminLicenseRecord[] }>(
    '/admin/licenses',
    body,
  );
}

export function generateAdminLicenseKey(body: GenerateAdminLicenseInput) {
  return apiPost<SetupResponse | AdminLicenseRecord>(
    '/admin/licenses/generate-key',
    body,
  );
}

export function revokeAdminLicense(id: string) {
  return apiPost<SetupResponse | AdminLicenseRecord>(`/admin/licenses/${id}/revoke`);
}

export function updateAdminLicense(id: string, body: UpdateAdminLicenseInput) {
  return apiPut<SetupResponse | AdminLicenseRecord>(`/admin/licenses/${id}`, body);
}

export function deleteAdminLicense(id: string) {
  return apiDelete<SetupResponse | { id: string; deleted: true }>(
    `/admin/licenses/${id}`,
  );
}

export function bulkRevokeAdminLicenses(ids: string[]) {
  return apiPost<SetupResponse | BulkActionResult>(
    '/admin/licenses/bulk-revoke',
    { ids },
  );
}

export function bulkDeleteAdminLicenses(ids: string[]) {
  return apiPost<SetupResponse | BulkActionResult>(
    '/admin/licenses/bulk-delete',
    { ids },
  );
}
