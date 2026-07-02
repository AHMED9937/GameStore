import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestSteamGuardCode } from '@gamestore/web/data-access';
import { useSteamGuardCode } from './use-steam-guard-code';

vi.mock('./steam-guard-totp', () => ({
  generateSteamGuardCode: vi.fn().mockResolvedValue('AB12C'),
  secondsUntilNextTotpWindow: vi.fn().mockReturnValue(25),
}));

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    requestSteamGuardCode: vi.fn(),
  };
});

describe('useSteamGuardCode', () => {
  beforeEach(() => {
    vi.mocked(requestSteamGuardCode).mockResolvedValue({
      code: 'AB12C',
      expiresInSeconds: 25,
      sharedSecret: 'testsharedsecretfortotp123456',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads an initial guard code for the license key', async () => {
    const { result } = renderHook(() => useSteamGuardCode('GS-TEST-KEY'));

    await waitFor(() => {
      expect(result.current.code).toBe('AB12C');
    });

    expect(requestSteamGuardCode).toHaveBeenCalledWith('GS-TEST-KEY');
    expect(result.current.expiresInSeconds).toBe(25);
  });
});
