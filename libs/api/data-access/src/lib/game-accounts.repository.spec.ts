import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { GameAccountsRepository } from './game-accounts.repository';

function createPrismaMock() {
  return {
    gameAccount: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'new' }),
      update: vi.fn().mockResolvedValue({ id: 'updated' }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
    },
    license: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

const SECRET_FIELDS = ['passwordEncrypted', 'sharedSecret'];

describe('GameAccountsRepository', () => {
  it('findAll never selects secret fields', async () => {
    const prisma = createPrismaMock();
    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);

    await repo.findAll();

    const select = prisma.gameAccount.findMany.mock.calls[0][0].select;
    for (const field of SECRET_FIELDS) {
      expect(select).not.toHaveProperty(field);
    }
    expect(select.maxActiveUsers).toBe(true);
  });

  it('findAll Filters by gameId when provided', async () => {
    const prisma = createPrismaMock();
    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);

    await repo.findAll({ gameId: 'game-1' });

    expect(prisma.gameAccount.findMany.mock.calls[0][0].where).toEqual({
      gameId: 'game-1',
    });
  });

  it('deactivate sets isActive false and redacts secrets', async () => {
    const prisma = createPrismaMock();
    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);

    await repo.deactivate('acc-1');

    const call = prisma.gameAccount.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'acc-1' });
    expect(call.data).toEqual({ isActive: false });
    for (const field of SECRET_FIELDS) {
      expect(call.select).not.toHaveProperty(field);
    }
  });

  it('countActivatedLicenses Filters by account and status', async () => {
    const prisma = createPrismaMock();
    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);

    await repo.countActivatedLicenses('acc-1');

    expect(prisma.license.count).toHaveBeenCalledWith({
      where: { accountId: 'acc-1', status: 'activated' },
    });
  });

  it('delete removes the pool account', async () => {
    const prisma = createPrismaMock();
    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);

    await repo.delete('acc-1');

    expect(prisma.gameAccount.delete).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      select: { id: true },
    });
  });

  it('findAvailableForGame picks account under its maxActiveUsers cap', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findMany.mockResolvedValue([
      { id: 'full', activeUsersCount: 50, maxActiveUsers: 50 },
      { id: 'open', activeUsersCount: 10, maxActiveUsers: 25 },
    ]);
    prisma.gameAccount.findUnique.mockResolvedValue({
      id: 'open',
      username: 'pool-user',
    });

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const account = await repo.findAvailableForGame('game-1');

    expect(account).toEqual({ id: 'open', username: 'pool-user' });
    expect(prisma.gameAccount.findUnique).toHaveBeenCalledWith({
      where: { id: 'open' },
    });
  });

  it('findAvailableForGame returns null when every account is at capacity', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findMany.mockResolvedValue([
      { id: 'full-a', activeUsersCount: 50, maxActiveUsers: 50 },
      { id: 'full-b', activeUsersCount: 30, maxActiveUsers: 30 },
    ]);

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const account = await repo.findAvailableForGame('game-1');

    expect(account).toBeNull();
    expect(prisma.gameAccount.findUnique).not.toHaveBeenCalled();
  });

  it('decrementActiveUsers never goes below zero', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findUnique.mockResolvedValue({
      id: 'acc-1',
      activeUsersCount: 0,
    });
    prisma.gameAccount.update.mockResolvedValue({
      id: 'acc-1',
      activeUsersCount: 0,
    });

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    await repo.decrementActiveUsers('acc-1');

    expect(prisma.gameAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: { activeUsersCount: 0 },
      select: expect.any(Object),
    });
  });

  it('clearGuardLockIfMatches only clears matching guard lock', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.updateMany = vi.fn().mockResolvedValue({ count: 1 });

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    await repo.clearGuardLockIfMatches('acc-1', 'license-1');

    expect(prisma.gameAccount.updateMany).toHaveBeenCalledWith({
      where: { id: 'acc-1', guardLockedByLicenseId: 'license-1' },
      data: { guardLockedByLicenseId: null },
    });
  });

  it('findAvailableForAssignment returns unassigned active accounts', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findMany.mockResolvedValue([
      { id: 'inv-1', username: 'pool-alpha', gameId: null, isActive: true },
    ]);

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const rows = await repo.findAvailableForAssignment('alpha');

    expect(prisma.gameAccount.findMany).toHaveBeenCalledWith({
      where: {
        gameId: null,
        isActive: true,
        username: { contains: 'alpha', mode: 'insensitive' },
      },
      orderBy: { username: 'asc' },
      take: 50,
      select: expect.any(Object),
    });
    expect(rows).toHaveLength(1);
  });

  it('assignToGame sets gameId on account', async () => {
    const prisma = createPrismaMock();
    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);

    await repo.assignToGame('acc-1', 'game-1');

    expect(prisma.gameAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: { gameId: 'game-1' },
      select: expect.any(Object),
    });
  });

  it('unassignFromGame clears gameId', async () => {
    const prisma = createPrismaMock();
    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);

    await repo.unassignFromGame('acc-1');

    expect(prisma.gameAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: { gameId: null },
      select: expect.any(Object),
    });
  });
});
