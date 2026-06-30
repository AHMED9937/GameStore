import { describe, expect, it } from 'vitest';
import { SteamGuardService } from './steam-guard.service';

describe('SteamGuardService', () => {
  const service = new SteamGuardService();

  it('returns setup text for guard-code without steam-totp calls', () => {
    expect(service.requestGuardCode()).toEqual({
      status: 'setup',
      integration: 'steam',
      message: 'Steam Guard — not implemented yet',
    });
  });
});
