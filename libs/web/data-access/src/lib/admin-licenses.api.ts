import { apiGet, apiPost } from './api-client';
import type { SetupResponse } from './admin.types';

export type AdminLicenseRecord = {
  id: string;
  licenseKey: string;
  gameId: string;
  status: string;
  buyerEmail: string | null;
};

export type AdminLicenseListRecord = {
  id: string;
  licenseKeyMasked: string;
  gameTitle: string;
  ownerEmail: string | null;
  status: string;
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
