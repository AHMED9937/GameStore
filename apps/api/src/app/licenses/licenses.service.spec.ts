import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@gamestore/api/auth';
import type { LicensesRepository } from '@gamestore/api/data-access';
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
  } as unknown as import('@gamestore/api/data-access').GameAccountsRepository;

  const crypto = {
    isConfigured: vi.fn().mockReturnValue(true),
    isEncrypted: vi.fn().mockReturnValue(false),
    decrypt: vi.fn(),
  } as unknown as import('@gamestore/api/steam').SteamCryptoService;

  let service: LicensesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LicensesService(licenses, accounts, crypto);
  });

  it('allows validate for unassigned licenses without a user', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OPEN-KEY',
      status: 'available',
      ownerId: null,
      expiresAt: null,
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
    expect(accounts.findAvailableForGame).not.toHaveBeenCalled();
  });

  it('findMine returns licenses for the current user', async () => {
    const rows = [
      {
        id: 'lic-1',
        licenseKey: 'KEY-1',
        status: 'available',
        source: 'purchase',
        expiresAt: null,
        game: { id: 'g1', title: 'Game', slug: 'game' },
      },
    ];
    vi.mocked(licenses.findByOwnerId).mockResolvedValue(rows as never);

    await expect(service.findMine(userA)).resolves.toEqual(rows);
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
});
