import { describe, expect, it } from 'vitest';
import { generateLicenseKey, maskLicenseKey } from './license-key.util';

describe('maskLicenseKey', () => {
  it('masks middle segments and keeps last four characters', () => {
    expect(maskLicenseKey('GS-ABCD-EF12')).toBe('GS-****-EF12');
  });

  it('handles generated keys', () => {
    const key = generateLicenseKey();
    const masked = maskLicenseKey(key);
    expect(masked.startsWith('GS-****-')).toBe(true);
    expect(masked.endsWith(key.slice(-4))).toBe(true);
  });
});
