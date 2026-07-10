import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LICENSE_VALIDITY_YEARS,
  defaultLicenseExpiresAt,
  resolveLicenseExpiresAt,
} from './license-validity.util';

describe('license-validity.util', () => {
  it('defaultLicenseExpiresAt adds the configured number of years', () => {
    const validFrom = new Date('2024-06-01T12:00:00.000Z');
    const expiresAt = defaultLicenseExpiresAt(validFrom);

    expect(expiresAt.getFullYear()).toBe(
      validFrom.getFullYear() + DEFAULT_LICENSE_VALIDITY_YEARS,
    );
  });

  it('resolveLicenseExpiresAt returns explicit expiry when set', () => {
    const validFrom = new Date('2024-01-01T00:00:00.000Z');
    const explicit = new Date('2025-01-01T00:00:00.000Z');

    expect(resolveLicenseExpiresAt(explicit, validFrom)).toEqual(explicit);
  });

  it('resolveLicenseExpiresAt falls back to the default validity window', () => {
    const validFrom = new Date('2024-01-01T00:00:00.000Z');

    expect(resolveLicenseExpiresAt(null, validFrom)).toEqual(
      defaultLicenseExpiresAt(validFrom),
    );
  });
});
