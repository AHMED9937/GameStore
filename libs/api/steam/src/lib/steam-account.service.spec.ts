import { describe, expect, it } from 'vitest';
import { SteamAccountService } from './steam-account.service';

describe('SteamAccountService', () => {
  const service = new SteamAccountService();

  it('returns setup health text', () => {
    expect(service.health()).toMatchObject({
      status: 'setup',
      integration: 'steam',
    });
    expect(service.health().message).toMatch(/not implemented yet$/);
  });
});
