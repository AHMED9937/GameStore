export const DEFAULT_LICENSE_VALIDITY_YEARS = 2;

export function defaultLicenseExpiresAt(validFrom: Date): Date {
  const result = new Date(validFrom);
  result.setFullYear(result.getFullYear() + DEFAULT_LICENSE_VALIDITY_YEARS);
  return result;
}

export function resolveLicenseExpiresAt(
  expiresAt: Date | null | undefined,
  validFrom: Date,
): Date {
  if (expiresAt) {
    return expiresAt;
  }
  return defaultLicenseExpiresAt(validFrom);
}
