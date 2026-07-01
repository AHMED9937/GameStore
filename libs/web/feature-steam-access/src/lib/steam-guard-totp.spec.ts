import { describe, expect, it } from 'vitest';
import SteamTotp from 'steam-totp';
import {
  generateSteamGuardCode,
  secondsUntilNextTotpWindow,
} from './steam-guard-totp';

describe('steam-guard-totp', () => {
  it('matches steam-totp for a fixed timestamp', async () => {
    const sharedSecret = 'dGVzdC1zZWNyZXQ=';
    const time = 1_700_000_000;
    const timeOffset = time - Math.floor(Date.now() / 1000);

    const expected = SteamTotp.generateAuthCode(sharedSecret, timeOffset);
    const actual = await generateSteamGuardCode(sharedSecret, time);

    expect(actual).toBe(expected);
  });

  it('counts down seconds until the next 30s window', () => {
    const nowSeconds = 1_700_000_017;
    const nowMs = nowSeconds * 1000;
    const expected = 30 - (nowSeconds % 30);

    expect(secondsUntilNextTotpWindow(nowMs)).toBe(expected);
  });
});
