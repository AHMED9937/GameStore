export const DEFAULT_LICENSE_VALIDITY_YEARS = 2;
const MS_PER_DAY = 86_400_000;

export type LicenseExpiryState = {
  expired: boolean;
  daysRemaining: number | null;
  label: string;
};

export function defaultLicenseExpiresAt(validFrom: Date): Date {
  const result = new Date(validFrom);
  result.setFullYear(result.getFullYear() + DEFAULT_LICENSE_VALIDITY_YEARS);
  return result;
}

export function resolveEffectiveExpiresAt(
  expiresAt: string | null | undefined,
  validFrom?: string | null,
): Date | null {
  if (expiresAt) {
    const explicit = new Date(expiresAt);
    return Number.isNaN(explicit.getTime()) ? null : explicit;
  }

  if (validFrom) {
    const start = new Date(validFrom);
    if (Number.isNaN(start.getTime())) {
      return null;
    }
    return defaultLicenseExpiresAt(start);
  }

  return null;
}

export function getDaysUntilExpiry(
  expiresAt: string | null | undefined,
  validFrom?: string | null,
  now = Date.now(),
): number | null {
  const effective = resolveEffectiveExpiresAt(expiresAt, validFrom);
  if (!effective) {
    return null;
  }

  const msRemaining = effective.getTime() - now;
  if (msRemaining <= 0) {
    return 0;
  }

  return Math.ceil(msRemaining / MS_PER_DAY);
}

export function getLicenseExpiryState(
  expiresAt: string | null | undefined,
  validFrom?: string | null,
  now = Date.now(),
): LicenseExpiryState {
  const effective = resolveEffectiveExpiresAt(expiresAt, validFrom);
  if (!effective) {
    return {
      expired: false,
      daysRemaining: null,
      label: 'Expiry unknown',
    };
  }

  const msRemaining = effective.getTime() - now;
  if (msRemaining <= 0) {
    return {
      expired: true,
      daysRemaining: 0,
      label: 'Expired',
    };
  }

  const sameCalendarDay =
    effective.toDateString() === new Date(now).toDateString();
  if (sameCalendarDay) {
    return {
      expired: false,
      daysRemaining: 1,
      label: 'Expires today',
    };
  }

  const daysRemaining = Math.ceil(msRemaining / MS_PER_DAY);
  if (daysRemaining === 1) {
    return {
      expired: false,
      daysRemaining: 1,
      label: 'Expires in 1 day',
    };
  }

  return {
    expired: false,
    daysRemaining,
    label: `Expires in ${daysRemaining} days`,
  };
}

export function formatPlanInterval(interval: string, intervalCount: number): string {
  if (intervalCount === 1) {
    const labels: Record<string, string> = {
      day: 'Daily',
      week: 'Weekly',
      month: 'Monthly',
      year: 'Annual',
    };
    return labels[interval] ?? interval;
  }

  return `Every ${intervalCount} ${interval}s`;
}

export function formatLicenseExpiry(
  expiresAt: string | null | undefined,
  validFrom?: string | null,
  now = Date.now(),
): string {
  return getLicenseExpiryState(expiresAt, validFrom, now).label;
}

export function isLicenseExpired(
  expiresAt: string | null | undefined,
  validFrom?: string | null,
  now = Date.now(),
): boolean {
  return getLicenseExpiryState(expiresAt, validFrom, now).expired;
}

export function formatLicenseSource(source: string): string {
  switch (source) {
    case 'subscription':
      return 'Pass';
    case 'purchase':
      return 'Purchase';
    case 'admin':
      return 'Admin';
    default:
      return source;
  }
}
