import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@gamestore/api/auth';
import type { LicensesRepository } from '@gamestore/api/data-access';
import type { EntitlementCleanupService } from '../entitlements/entitlement-cleanup.service';
import { LicensesService } from './licenses.service';

const userA: AuthUser = {
  id: 'user-a',
  clerkId: 'clerk-a',
  email: 'a@example.com',
  firstName: 'A',
  lastName: 'User',
  role: 'user',
};

const userB: AuthUser = {
  id: 'user-b',
  clerkId: 'clerk-b',
  email: 'b@example.com',
  firstName: 'B',
  lastName: 'User',
  role: 'user',
};

describe('LicensesService ownership', () => {
  const licenses = {
    findByKey: vi.fn(),
    findByKeyForActivation: vi.fn(),
    findByOwnerId: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    revoke: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    activateLicense: vi.fn(),
  } as unknown as LicensesRepository;

  const accounts = {
    findAvailableForGame: vi.fn(),
    claimSeatForGame: vi.fn(),
    advanceNextAccountIfFull: vi.fn(),
  } as unknown as import('@gamestore/api/data-access').GameAccountsRepository;

  const crypto = {
    isConfigured: vi.fn().mockReturnValue(true),
    isEncrypted: vi.fn().mockReturnValue(false),
    decrypt: vi.fn(),
  } as unknown as import('@gamestore/api/steam').SteamCryptoService;

  const entitlementCleanup = {
    revokeLicenseWithCleanup: vi.fn(),
    releaseLicenseFromPool: vi.fn(),
  } satisfies Pick<
    EntitlementCleanupService,
    'revokeLicenseWithCleanup' | 'releaseLicenseFromPool'
  >;

  let service: LicensesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LicensesService(
      licenses,
      accounts,
      crypto,
      entitlementCleanup as EntitlementCleanupService,
    );
  });

  it('allows validate for unassigned licenses without a user', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OPEN-KEY',
      status: 'available',
      ownerId: null,
      expiresAt: null,
      validFrom: new Date(),
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('OPEN-KEY')).resolves.toEqual({
      licenseKey: 'OPEN-KEY',
      status: 'available',
      game: { id: 'g1', title: 'Game', slug: 'game' },
    });
  });

  it('rejects validate for owned licenses without auth', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OWNED-KEY',
      status: 'available',
      ownerId: 'user-a',
      expiresAt: null,
      validFrom: new Date(),
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('OWNED-KEY')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows validate when the owner is authenticated', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OWNED-KEY',
      status: 'available',
      ownerId: 'user-a',
      expiresAt: null,
      validFrom: new Date(),
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('OWNED-KEY', userA)).resolves.toEqual({
      licenseKey: 'OWNED-KEY',
      status: 'available',
      game: { id: 'g1', title: 'Game', slug: 'game' },
    });
  });

  it('rejects validate when a different user is authenticated', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OWNED-KEY',
      status: 'available',
      ownerId: 'user-a',
      expiresAt: null,
      validFrom: new Date(),
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('OWNED-KEY', userB)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects validate for expired licenses', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'EXPIRED-KEY',
      status: 'available',
      ownerId: null,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('EXPIRED-KEY')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects activate for expired licenses', async () => {
    vi.mocked(licenses.findByKeyForActivation).mockResolvedValue({
      id: 'lic-expired',
      licenseKey: 'EXPIRED-KEY',
      status: 'available',
      ownerId: 'user-a',
      gameId: 'g1',
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      game: { id: 'g1', title: 'Game', slug: 'game', coverImage: null },
      account: null,
    } as never);

    await expect(service.activate('EXPIRED-KEY', userA)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(accounts.claimSeatForGame).not.toHaveBeenCalled();
  });

  it('activates a reserved license without claiming another seat', async () => {
    vi.mocked(licenses.findByKeyForActivation).mockResolvedValue({
      id: 'lic-1',
      licenseKey: 'RESERVED-KEY',
      status: 'available',
      ownerId: 'user-a',
      gameId: 'g1',
      accountId: 'acct-1',
      expiresAt: null,
      validFrom: new Date(),
      game: {
        id: 'g1',
        title: 'Game',
        slug: 'game',
        coverImage: null,
        coverCardImage: null,
      },
      account: {
        id: 'acct-1',
        username: 'pool-user',
        passwordEncrypted: 'plain-pass',
        isActive: true,
        lockedUntil: null,
      },
    } as never);
    vi.mocked(licenses.activateLicense).mockResolvedValue({
      licenseKey: 'RESERVED-KEY',
      status: 'activated',
      game: {
        id: 'g1',
        title: 'Game',
        slug: 'game',
        coverImage: null,
        coverCardImage: null,
      },
      account: {
        id: 'acct-1',
        username: 'pool-user',
        passwordEncrypted: 'plain-pass',
      },
    } as never);

    const result = await service.activate('RESERVED-KEY', userA);

    expect(accounts.claimSeatForGame).not.toHaveBeenCalled();
    expect(licenses.activateLicense).toHaveBeenCalledWith({
      licenseId: 'lic-1',
      accountId: 'acct-1',
      ownerId: 'user-a',
      seatAlreadyReserved: true,
    });
    expect(result.account.username).toBe('pool-user');
  });

  it('falls back to claimSeatForGame when reservation is missing', async () => {
    vi.mocked(licenses.findByKeyForActivation).mockResolvedValue({
      id: 'lic-2',
      licenseKey: 'OPEN-KEY',
      status: 'available',
      ownerId: 'user-a',
      gameId: 'g1',
      accountId: null,
      expiresAt: null,
      validFrom: new Date(),
      game: {
        id: 'g1',
        title: 'Game',
        slug: 'game',
        coverImage: null,
        coverCardImage: null,
      },
      account: null,
    } as never);
    vi.mocked(accounts.claimSeatForGame).mockResolvedValue({
      id: 'acct-2',
      username: 'fallback-user',
      passwordEncrypted: 'secret',
    } as never);
    vi.mocked(licenses.activateLicense).mockResolvedValue({
      licenseKey: 'OPEN-KEY',
      status: 'activated',
      game: {
        id: 'g1',
        title: 'Game',
        slug: 'game',
        coverImage: null,
        coverCardImage: null,
      },
      account: {
        id: 'acct-2',
        username: 'fallback-user',
        passwordEncrypted: 'secret',
      },
    } as never);

    await service.activate('OPEN-KEY', userA);

    expect(accounts.claimSeatForGame).toHaveBeenCalledWith('g1');
    expect(licenses.activateLicense).toHaveBeenCalledWith({
      licenseId: 'lic-2',
      accountId: 'acct-2',
      ownerId: 'user-a',
      seatAlreadyReserved: true,
    });
    expect(accounts.advanceNextAccountIfFull).toHaveBeenCalledWith('g1');
  });

  it('findMine returns licenses for the current user', async () => {
    const rows = [
      {
        id: 'lic-1',
        licenseKey: 'KEY-1',
        status: 'available',
        source: 'purchase',
        expiresAt: null,
        validFrom: new Date('2024-01-01T00:00:00.000Z'),
        game: { id: 'g1', title: 'Game', slug: 'game' },
      },
    ];
    vi.mocked(licenses.findByOwnerId).mockResolvedValue(rows as never);

    await expect(service.findMine(userA)).resolves.toEqual([
      {
        id: 'lic-1',
        licenseKey: 'KEY-1',
        status: 'available',
        source: 'purchase',
        validFrom: '2024-01-01T00:00:00.000Z',
        expiresAt: '2026-01-01T00:00:00.000Z',
        game: { id: 'g1', title: 'Game', slug: 'game' },
      },
    ]);
    expect(licenses.findByOwnerId).toHaveBeenCalledWith('user-a');
  });

  it('update patches buyer metadata for available licenses', async () => {
    vi.mocked(licenses.findById).mockResolvedValue({
      id: 'lic-1',
      status: 'available',
    } as never);
    vi.mocked(licenses.update).mockResolvedValue({
      id: 'lic-1',
      buyerEmail: 'new@example.com',
      buyerCountry: 'US',
    } as never);

    await expect(
      service.update('lic-1', {
        buyerEmail: 'new@example.com',
        buyerCountry: 'us',
      }),
    ).resolves.toEqual({
      id: 'lic-1',
      buyerEmail: 'new@example.com',
      buyerCountry: 'US',
    });

    expect(licenses.update).toHaveBeenCalledWith('lic-1', {
      buyerEmail: 'new@example.com',
      buyerCountry: 'US',
    });
  });

  it('update sets default expiry when expiresAt is cleared', async () => {
    const validFrom = new Date('2024-01-01T00:00:00.000Z');
    vi.mocked(licenses.findById).mockResolvedValue({
      id: 'lic-1',
      status: 'available',
      validFrom,
    } as never);
    vi.mocked(licenses.update).mockResolvedValue({
      id: 'lic-1',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    } as never);

    await service.update('lic-1', { expiresAt: null });

    expect(licenses.update).toHaveBeenCalledWith('lic-1', {
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('update rejects non-available licenses', async () => {
    vi.mocked(licenses.findById).mockResolvedValue({
      id: 'lic-1',
      status: 'activated',
    } as never);

    await expect(
      service.update('lic-1', { buyerEmail: 'new@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remove deletes non-activated licenses', async () => {
    vi.mocked(licenses.findById).mockResolvedValue({
      id: 'lic-1',
      status: 'revoked',
    } as never);
    vi.mocked(licenses.delete).mockResolvedValue({ id: 'lic-1' } as never);

    await expect(service.remove('lic-1')).resolves.toEqual({
      id: 'lic-1',
      deleted: true,
    });
    expect(licenses.delete).toHaveBeenCalledWith('lic-1');
  });

  it('remove rejects activated licenses', async () => {
    vi.mocked(licenses.findById).mockResolvedValue({
      id: 'lic-1',
      status: 'activated',
    } as never);

    await expect(service.remove('lic-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('revoke delegates to entitlement cleanup', async () => {
    vi.mocked(licenses.findById).mockResolvedValue({
      id: 'lic-1',
      status: 'activated',
      accountId: 'account-1',
    } as never);
    vi.mocked(entitlementCleanup.revokeLicenseWithCleanup).mockResolvedValue({
      id: 'lic-1',
      status: 'revoked',
    } as never);

    await expect(service.revoke('lic-1')).resolves.toEqual({
      id: 'lic-1',
      status: 'revoked',
    });
    expect(entitlementCleanup.revokeLicenseWithCleanup).toHaveBeenCalledWith(
      'lic-1',
    );
  });
});
