import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '@gamestore/api/prisma';
import type {
  GameAccountsRepository,
  LicensesRepository,
  OrdersRepository,
} from '@gamestore/api/data-access';
import { EntitlementCleanupService } from './entitlement-cleanup.service';

describe('EntitlementCleanupService', () => {
  const tx = {
    license: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    gameAccount: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    game: {
      findUnique: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) =>
      fn(tx),
    ),
    order: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    game: {
      findUnique: vi.fn(),
    },
  } satisfies Pick<PrismaService, '$transaction' | 'order' | 'game'>;

  const licenses = {
    findByIdForCleanup: vi.fn(),
    findById: vi.fn(),
    setRevoked: vi.fn(),
    findByGameIdExcludingRevoked: vi.fn().mockResolvedValue([]),
  } satisfies Pick<
    LicensesRepository,
    | 'findByIdForCleanup'
    | 'findById'
    | 'setRevoked'
    | 'findByGameIdExcludingRevoked'
  >;

  const accounts = {
    findById: vi.fn().mockResolvedValue({ id: 'account-1' }),
    findActivatedLicensesByAccountId: vi.fn().mockResolvedValue([]),
    countSeatHoldingLicenses: vi.fn().mockResolvedValue(0),
    deactivate: vi.fn().mockResolvedValue({ id: 'account-1', isActive: false }),
    decrementActiveUsers: vi.fn(),
  } satisfies Pick<
    GameAccountsRepository,
    | 'findById'
    | 'findActivatedLicensesByAccountId'
    | 'countSeatHoldingLicenses'
    | 'deactivate'
    | 'decrementActiveUsers'
  >;

  const orders = {
    deleteById: vi.fn(),
  } satisfies Pick<OrdersRepository, 'deleteById'>;

  let service: EntitlementCleanupService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EntitlementCleanupService(
      prisma as PrismaService,
      licenses as LicensesRepository,
      accounts as GameAccountsRepository,
      orders as OrdersRepository,
    );
  });

  it('releaseLicenseFromPool decrements count and clears account link', async () => {
    tx.license.findUnique.mockResolvedValue({
      id: 'license-1',
      accountId: 'account-1',
    });
    tx.gameAccount.findUnique.mockResolvedValue({
      id: 'account-1',
      activeUsersCount: 2,
      guardLockedByLicenseId: 'license-1',
    });

    await service.releaseLicenseFromPool('license-1');

    expect(tx.license.update).toHaveBeenCalledWith({
      where: { id: 'license-1' },
      data: { accountId: null },
    });
    expect(tx.gameAccount.update).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      data: {
        activeUsersCount: 1,
        guardLockedByLicenseId: null,
      },
    });
  });

  it('releaseLicenseFromPool is a no-op when license has no account', async () => {
    tx.license.findUnique.mockResolvedValue({
      id: 'license-1',
      accountId: null,
    });

    await service.releaseLicenseFromPool('license-1');

    expect(tx.license.update).not.toHaveBeenCalled();
    expect(tx.gameAccount.update).not.toHaveBeenCalled();
  });

  it('revokeLicenseWithCleanup is idempotent for already revoked licenses', async () => {
    licenses.findByIdForCleanup.mockResolvedValue({
      id: 'license-1',
      status: 'revoked',
      accountId: null,
      gameId: 'game-1',
    });
    licenses.findById.mockResolvedValue({ id: 'license-1', status: 'revoked' });

    await expect(service.revokeLicenseWithCleanup('license-1')).resolves.toEqual({
      id: 'license-1',
      status: 'revoked',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(licenses.setRevoked).not.toHaveBeenCalled();
  });

  it('revokeLicenseWithCleanup revokes never-activated license without pool mutation', async () => {
    licenses.findByIdForCleanup.mockResolvedValue({
      id: 'license-1',
      status: 'available',
      accountId: null,
      gameId: 'game-1',
    });
    tx.license.findUnique.mockResolvedValue({
      id: 'license-1',
      accountId: null,
    });
    licenses.setRevoked.mockResolvedValue({ id: 'license-1', status: 'revoked' });

    await service.revokeLicenseWithCleanup('license-1');

    expect(licenses.setRevoked).toHaveBeenCalledWith('license-1');
    expect(tx.gameAccount.update).not.toHaveBeenCalled();
  });

  it('revokeLicenseWithCleanup throws when license is missing', async () => {
    licenses.findByIdForCleanup.mockResolvedValue(null);

    await expect(service.revokeLicenseWithCleanup('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deactivateAccountWithCleanup throws when account is missing', async () => {
    accounts.findById.mockResolvedValue(null);

    await expect(
      service.deactivateAccountWithCleanup('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivateAccountWithCleanup soft-deactivates without revoking', async () => {
    accounts.findById.mockResolvedValue({ id: 'account-1' });
    accounts.countSeatHoldingLicenses.mockResolvedValue(0);

    await service.deactivateAccountWithCleanup('account-1');

    expect(licenses.setRevoked).not.toHaveBeenCalled();
    expect(accounts.deactivate).toHaveBeenCalledWith('account-1');
  });

  it('deactivateAccountWithCleanup rejects when seat-holding licenses remain', async () => {
    accounts.findById.mockResolvedValue({ id: 'account-1' });
    accounts.countSeatHoldingLicenses.mockResolvedValue(2);

    await expect(
      service.deactivateAccountWithCleanup('account-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(accounts.deactivate).not.toHaveBeenCalled();
  });
});
