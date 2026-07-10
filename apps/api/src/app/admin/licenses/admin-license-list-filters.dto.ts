export type LicenseExpiresFilter = 'lifetime' | 'expiring' | 'expired';

export type AdminLicenseListFiltersDto = {
  game?: string;
  source?: string;
  owner?: string;
  status?: string;
  expires?: LicenseExpiresFilter;
};
