import { describe, expect, it } from 'vitest';
import {
  formatLicenseExpiry,
  formatPlanInterval,
  isLicenseExpired,
} from './subscription.utils';

describe('subscription.utils', () => {
  it('formats common plan intervals', () => {
    expect(formatPlanInterval('month', 1)).toBe('Monthly');
    expect(formatPlanInterval('year', 1)).toBe('Annual');
    expect(formatPlanInterval('month', 3)).toBe('Every 3 months');
  });

  it('formats license expiry states', () => {
    expect(formatLicenseExpiry(null)).toBe('Lifetime access');
    expect(formatLicenseExpiry('2020-01-01T00:00:00.000Z')).toBe('Expired');
    expect(formatLicenseExpiry('2099-01-01T00:00:00.000Z')).toMatch(/^Expires /);
  });

  it('detects expired licenses', () => {
    expect(isLicenseExpired(null)).toBe(false);
    expect(isLicenseExpired('2020-01-01T00:00:00.000Z')).toBe(true);
    expect(isLicenseExpired('2099-01-01T00:00:00.000Z')).toBe(false);
  });
});
