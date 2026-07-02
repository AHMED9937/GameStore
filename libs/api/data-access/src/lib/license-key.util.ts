import { randomBytes } from 'node:crypto';

export function generateLicenseKey(): string {
  const segments = Array.from({ length: 3 }, () =>
    randomBytes(2).toString('hex').toUpperCase(),
  );
  return `GS-${segments.join('-')}`;
}

/** Masks a license key for admin list views, e.g. `GS-ABCD-EF12` → `GS-****-EF12`. */
export function maskLicenseKey(licenseKey: string): string {
  const trimmed = licenseKey.trim();
  if (!trimmed) {
    return '—';
  }

  const suffix = trimmed.length >= 4 ? trimmed.slice(-4) : trimmed;
  return `GS-****-${suffix}`;
}
