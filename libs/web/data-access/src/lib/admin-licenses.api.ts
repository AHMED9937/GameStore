import { apiDelete, apiGet, apiPost, apiPut } from './api-client';
import type { SetupResponse } from './admin.types';

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

export function getAdminLicenses() {
  return apiGet<SetupResponse | AdminLicenseListRecord[]>('/admin/licenses');
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
