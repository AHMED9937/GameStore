import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestSteamGuardCode } from '@gamestore/web/data-access';
import { useSteamGuardCode } from './use-steam-guard-code';

vi.mock('@gamestore/web/data-access', () => ({
  requestSteamGuardCode: vi.fn(),
}));

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
      expect(result.current.code).toMatch(/^[A-Z0-9]{5}$/);
    });

    expect(requestSteamGuardCode).toHaveBeenCalledWith('GS-TEST-KEY');
    expect(result.current.expiresInSeconds).toBeGreaterThan(0);
    expect(result.current.expiresInSeconds).toBeLessThanOrEqual(30);
  });
});
