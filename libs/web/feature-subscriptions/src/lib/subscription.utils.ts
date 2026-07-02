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

export function formatLicenseExpiry(expiresAt: string | null): string {
  if (!expiresAt) {
    return 'Lifetime access';
  }

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown expiry';
  }

  if (date.getTime() <= Date.now()) {
    return 'Expired';
  }

  return `Expires ${date.toLocaleDateString()}`;
}

export function isLicenseExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false;
  }

  const date = new Date(expiresAt);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
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
