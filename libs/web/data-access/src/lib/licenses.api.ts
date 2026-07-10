import { apiGet, apiPost } from './api-client';

export type LicenseGameSummary = {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  coverCardImage?: string | null;
};

export type LicenseValidation = {
  licenseKey: string;
  status: string;
  game: LicenseGameSummary;
};

export type LicenseActivation = {
  licenseKey: string;
  status: 'activated';
  game: LicenseGameSummary;
  account: {
    username: string;
    password: string;
  };
};

export type UserLicenseSummary = {
  id: string;
  licenseKey: string;
  status: string;
  source: string;
  validFrom: string;
  expiresAt: string;
  game: { id: string; title: string; slug: string };
};

export async function validateLicense(
  licenseKey: string,
): Promise<LicenseValidation> {
  return apiPost<LicenseValidation>('/licenses/validate', { licenseKey });
}

export async function activateLicense(
  licenseKey: string,
): Promise<LicenseActivation> {
  return apiPost<LicenseActivation>('/licenses/activate', { licenseKey });
}

export async function fetchMyLicenses(): Promise<UserLicenseSummary[]> {
  return apiGet<UserLicenseSummary[]>('/licenses/mine');
}
