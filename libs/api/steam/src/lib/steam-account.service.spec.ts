import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SteamAccountService } from './steam-account.service';
import { SteamCryptoService } from './steam-crypto.service';

const TEST_KEY = 'a'.repeat(64);

describe('SteamAccountService', () => {
  beforeEach(() => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns ok health when encryption key is configured', () => {
    const service = new SteamAccountService(new SteamCryptoService());
    expect(service.health()).toMatchObject({
      status: 'ok',
      integration: 'steam',
      encryption: 'valid',
    });
  });

  it('returns setup health when encryption key is missing', () => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', '');
    const service = new SteamAccountService(new SteamCryptoService());
    expect(service.health()).toMatchObject({
      status: 'setup',
      integration: 'steam',
      encryption: 'missing',
    });
  });
});
