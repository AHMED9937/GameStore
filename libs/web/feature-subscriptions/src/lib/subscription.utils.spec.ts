import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatLicenseExpiry,
  formatPlanInterval,
  getLicenseExpiryState,
  isLicenseExpired,
} from './subscription.utils';

describe('subscription.utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats common plan intervals', () => {
    expect(formatPlanInterval('month', 1)).toBe('Monthly');
    expect(formatPlanInterval('year', 1)).toBe('Annual');
    expect(formatPlanInterval('month', 3)).toBe('Every 3 months');
  });

  it('formats active license expiry in days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));

    expect(
      formatLicenseExpiry('2026-01-15T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
    ).toBe('Expires in 14 days');
    expect(
      formatLicenseExpiry('2026-01-02T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
    ).toBe('Expires in 1 day');
    expect(
      formatLicenseExpiry('2026-01-01T18:00:00.000Z', '2024-01-01T00:00:00.000Z'),
    ).toBe('Expires today');
  });

  it('uses the default two-year window when expiresAt is missing', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));

    expect(
      getLicenseExpiryState(null, '2024-01-01T00:00:00.000Z').label,
    ).toBe('Expires in 214 days');
  });

  it('detects expired licenses using resolved expiry dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));

    expect(isLicenseExpired('2020-01-01T00:00:00.000Z')).toBe(true);
    expect(isLicenseExpired(null, '2020-01-01T00:00:00.000Z')).toBe(true);
    expect(isLicenseExpired('2099-01-01T00:00:00.000Z')).toBe(false);
  });
});
