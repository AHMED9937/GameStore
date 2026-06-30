import { apiPost } from './api-client';

export type SetupResponse = {
  status: 'setup';
  integration: string;
  message: string;
};

export type LicenseValidation = {
  licenseKey: string;
  status: string;
  game: { id: string; title: string; slug: string };
};

export type UserLicenseSummary = {
  id: string;
  licenseKey: string;
  status: string;
  game: { id: string; title: string; slug: string };
};

export async function validateLicense(
  licenseKey: string,
): Promise<LicenseValidation> {
  return apiPost<LicenseValidation>('/licenses/validate', { licenseKey });
}

export async function fetchMyLicenses(): Promise<UserLicenseSummary[]> {
  return apiGet<UserLicenseSummary[]>('/licenses/mine');
}
