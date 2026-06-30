import { describe, expect, it, vi } from 'vitest';
import { SteamConfig } from './steam.config';

describe('SteamConfig', () => {
  it('returns setup response for guard-code', () => {
    expect(SteamConfig.getSetupResponse('guard-code')).toEqual({
      status: 'setup',
      integration: 'steam',
      message: 'Steam Guard — not implemented yet',
    });
  });

  it('validates encryption key format without crypto operations', () => {
    expect(SteamConfig.validateEncryptionKey('')).toBe('missing');
    expect(
      SteamConfig.validateEncryptionKey(
        'a'.repeat(64),
      ),
    ).toBe('valid');
    expect(SteamConfig.validateEncryptionKey('short')).toBe('invalid');
  });

  it('validates cooldown minutes', () => {
    expect(SteamConfig.validateCooldownMinutes('')).toBe('missing');
    expect(SteamConfig.validateCooldownMinutes('15')).toBe('valid');
    expect(SteamConfig.validateCooldownMinutes('0')).toBe('invalid');
  });

  it('reads env vars and reports status', () => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', 'a'.repeat(64));
    vi.stubEnv('STEAM_GUARD_COOLDOWN_MINUTES', '15');

    expect(SteamConfig.readEnv()).toEqual({
      encryptionKey: 'a'.repeat(64),
      guardCooldownMinutes: '15',
    });
    expect(SteamConfig.getEnvStatus()).toEqual({
      encryptionKey: 'valid',
      guardCooldownMinutes: 'valid',
    });
    expect(SteamConfig.readCooldownMinutes()).toBe(15);

    vi.unstubAllEnvs();
  });

  it('returns health response based on configuration', () => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', 'a'.repeat(64));
    expect(SteamConfig.getHealthResponse().message).toBe(
      'Steam — configured, not implemented yet',
    );
    vi.unstubAllEnvs();

    expect(SteamConfig.getHealthResponse().message).toBe(
      'Steam — not configured, not implemented yet',
    );
  });
});
