import { describe, expect, it } from 'vitest';
import { SteamGuardService } from './steam-guard.service';
import { SteamCryptoService } from './steam-crypto.service';
import { vi, beforeEach, afterEach } from 'vitest';

const TEST_KEY = 'a'.repeat(64);

describe('SteamGuardService', () => {
  beforeEach(() => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('generates a code from an encrypted shared secret', () => {
    const crypto = new SteamCryptoService();
    const service = new SteamGuardService(crypto);
    const secret = 'testsharedsecretfortotp123456';
    const encrypted = crypto.encrypt(secret);
    const result = service.generateCodeFromStoredSecret(encrypted);

    expect(result.code).toMatch(/^[A-Z0-9]{5}$/);
    expect(result.expiresInSeconds).toBeGreaterThan(0);
    expect(result.expiresInSeconds).toBeLessThanOrEqual(30);
  });
});
