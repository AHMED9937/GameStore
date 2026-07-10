export const DEFAULT_LICENSE_VALIDITY_YEARS = 2;

export function defaultLicenseExpiresAt(validFrom: Date): Date {
  const result = new Date(validFrom);
  result.setFullYear(result.getFullYear() + DEFAULT_LICENSE_VALIDITY_YEARS);
  return result;
}

export function resolveLicenseExpiresAt(
  expiresAt: string | null | undefined,
  validFrom: string,
): Date {
  if (expiresAt) {
    return new Date(expiresAt);
  }
  return defaultLicenseExpiresAt(new Date(validFrom));
}

export function toDatetimeLocalValue(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function formatLicenseExpiryLabel(
  expiresAt: string | null,
  validFrom: string,
): string {
  const resolved = resolveLicenseExpiresAt(expiresAt, validFrom);
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(resolved);
  } catch {
    return resolved.toISOString();
  }
}
