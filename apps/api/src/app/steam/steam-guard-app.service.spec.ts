import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import type { AuthUser } from '@gamestore/api/auth';
import { SteamCryptoService, SteamGuardService } from '@gamestore/api/steam';
import { SteamGuardAppService } from './steam-guard-app.service';

const TEST_KEY = 'e'.repeat(64);

describe('SteamGuardAppService cooldown', () => {
  const user: AuthUser = {
    id: 'user-1',
    clerkId: 'clerk-user-1',
    role: 'user',
  };

  beforeEach(() => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', TEST_KEY);
    vi.stubEnv('STEAM_GUARD_COOLDOWN_MINUTES', '15');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 429 when another license owner requests during pool cooldown', async () => {
    const lockedUntil = new Date(Date.now() + 60_000);
    const crypto = new SteamCryptoService();
    const sharedSecret = crypto.encrypt('testsharedsecretfortotp123456');
    const otherUser: AuthUser = {
      id: 'user-2',
      clerkId: 'clerk-user-2',
      role: 'user',
    };

    const prisma = {
      license: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'license-2',
          licenseKey: 'GS-OTHER-KEY',
          status: 'activated',
          ownerId: otherUser.id,
          accountId: 'account-1',
          account: {
            id: 'account-1',
            sharedSecret,
            lockedUntil,
            guardLockedByLicenseId: 'license-1',
          },
        }),
      },
      gameAccount: {
        update: vi.fn(),
      },
    };

    const service = new SteamGuardAppService(
      prisma as never,
      crypto,
      new SteamGuardService(crypto),
    );

    await expect(
      service.requestGuardCode('GS-OTHER-KEY', otherUser),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });

    expect(prisma.gameAccount.update).not.toHaveBeenCalled();
  });

  it('allows the license owner to refresh during pool cooldown', async () => {
    const lockedUntil = new Date(Date.now() + 60_000);
    const crypto = new SteamCryptoService();
    const sharedSecret = crypto.encrypt('testsharedsecretfortotp123456');
    const update = vi.fn().mockResolvedValue({});

    const prisma = {
      license: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'license-1',
          licenseKey: 'GS-TEST-KEY',
          status: 'activated',
          ownerId: user.id,
          accountId: 'account-1',
          account: {
            id: 'account-1',
            sharedSecret,
            lockedUntil,
            guardLockedByLicenseId: 'license-1',
          },
        }),
      },
      gameAccount: {
        update,
      },
    };

    const service = new SteamGuardAppService(
      prisma as never,
      crypto,
      new SteamGuardService(crypto),
    );

    const result = await service.requestGuardCode('GS-TEST-KEY', user);

    expect(result.code).toMatch(/^[A-Z0-9]{5}$/);
    expect(result.sharedSecret).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it('sets lockedUntil after issuing a guard code', async () => {
    const crypto = new SteamCryptoService();
    const sharedSecret = crypto.encrypt('testsharedsecretfortotp123456');
    const update = vi.fn().mockResolvedValue({});

    const prisma = {
      license: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'license-1',
          licenseKey: 'GS-TEST-KEY',
          status: 'activated',
          ownerId: user.id,
          accountId: 'account-1',
          account: {
            id: 'account-1',
            sharedSecret,
            lockedUntil: null,
          },
        }),
      },
      gameAccount: {
        update,
      },
    };

    const service = new SteamGuardAppService(
      prisma as never,
      crypto,
      new SteamGuardService(crypto),
    );

    const result = await service.requestGuardCode('GS-TEST-KEY', user);

    expect(result.code).toMatch(/^[A-Z0-9]{5}$/);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      data: {
        lockedUntil: expect.any(Date),
        guardLockedByLicenseId: 'license-1',
      },
    });
  });
});
