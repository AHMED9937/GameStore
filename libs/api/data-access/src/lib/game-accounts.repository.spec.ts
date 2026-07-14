import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { GameAccountsRepository } from './game-accounts.repository';

function createPrismaMock() {
  const prisma = {
    game: {
      findUnique: vi.fn().mockResolvedValue({ nextAccountId: null }),
      update: vi.fn().mockResolvedValue({ id: 'game-1', nextAccountId: null }),
    },
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
      update: vi.fn().mockResolvedValue({ id: 'lic' }),
    },
    $transaction: vi.fn(),
  };

  prisma.$transaction.mockImplementation(
    async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
  );

  return prisma;
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
      {
        id: 'full',
        activeUsersCount: 50,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      },
      {
        id: 'open',
        activeUsersCount: 10,
        maxActiveUsers: 25,
        isActive: true,
        lockedUntil: null,
      },
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
      {
        id: 'full-a',
        activeUsersCount: 50,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      },
      {
        id: 'full-b',
        activeUsersCount: 30,
        maxActiveUsers: 30,
        isActive: true,
        lockedUntil: null,
      },
    ]);

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const account = await repo.findAvailableForGame('game-1');

    expect(account).toBeNull();
  });

  it('claimSeatForGame prefers nextAccountId then fails over', async () => {
    const prisma = createPrismaMock();
    prisma.game.findUnique.mockResolvedValue({ nextAccountId: 'preferred' });
    prisma.gameAccount.findMany.mockResolvedValue([
      {
        id: 'preferred',
        activeUsersCount: 50,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      },
      {
        id: 'open',
        activeUsersCount: 1,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      },
    ]);
    prisma.gameAccount.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === 'preferred') {
        return {
          id: 'preferred',
          maxActiveUsers: 50,
          activeUsersCount: 50,
          isActive: true,
          lockedUntil: null,
        };
      }
      if (where.id === 'open') {
        return {
          id: 'open',
          maxActiveUsers: 50,
          activeUsersCount: 1,
          isActive: true,
          lockedUntil: null,
          username: 'failover',
        };
      }
      return null;
    });
    prisma.gameAccount.updateMany.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === 'preferred') {
          return { count: 0 };
        }
        return { count: 1 };
      },
    );

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const claimed = await repo.claimSeatForGame('game-1');

    expect(claimed).toMatchObject({ id: 'open' });
    expect(prisma.gameAccount.updateMany).toHaveBeenCalled();
  });

  it('advanceNextAccountIfFull updates pointer when preferred is full', async () => {
    const prisma = createPrismaMock();
    prisma.game.findUnique.mockResolvedValue({ nextAccountId: 'full' });
    prisma.gameAccount.findUnique.mockResolvedValue({
      id: 'full',
      gameId: 'game-1',
      isActive: true,
      activeUsersCount: 50,
      maxActiveUsers: 50,
      lockedUntil: null,
    });
    prisma.gameAccount.findMany.mockResolvedValue([
      {
        id: 'open',
        activeUsersCount: 0,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      },
    ]);
    prisma.gameAccount.findUnique
      .mockResolvedValueOnce({
        id: 'full',
        gameId: 'game-1',
        isActive: true,
        activeUsersCount: 50,
        maxActiveUsers: 50,
        lockedUntil: null,
      })
      .mockResolvedValueOnce({
        id: 'open',
        username: 'next',
      });

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const nextId = await repo.advanceNextAccountIfFull('game-1');

    expect(nextId).toBe('open');
    expect(prisma.game.update).toHaveBeenCalledWith({
      where: { id: 'game-1' },
      data: { nextAccountId: 'open' },
    });
  });

  it('migrateLicensesOffAccount moves licenses to the chosen target then clears gameId', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === 'from') {
          return { id: 'from', gameId: 'game-1', activeUsersCount: 1 };
        }
        if (where.id === 'to') {
          return {
            id: 'to',
            gameId: 'game-1',
            maxActiveUsers: 50,
            activeUsersCount: 0,
            isActive: true,
            lockedUntil: null,
          };
        }
        return null;
      },
    );
    prisma.license.findMany.mockResolvedValue([{ id: 'lic-1' }]);
    prisma.gameAccount.updateMany.mockResolvedValue({ count: 1 });
    prisma.game.findUnique.mockResolvedValue({ nextAccountId: 'from' });
    prisma.gameAccount.findMany.mockResolvedValue([
      {
        id: 'to',
        activeUsersCount: 1,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      },
    ]);
    prisma.gameAccount.update.mockResolvedValue({
      id: 'from',
      gameId: null,
      username: 'old',
    });

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const result = await repo.migrateLicensesOffAccount('from', 'game-1', 'to');

    expect(prisma.license.update).toHaveBeenCalledWith({
      where: { id: 'lic-1' },
      data: { accountId: 'to' },
    });
    expect(result).toMatchObject({ gameId: null });
  });

  it('migrateLicensesOffAccount requires target when licenses occupy the account', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findUnique.mockResolvedValue({
      id: 'from',
      gameId: 'game-1',
      activeUsersCount: 1,
    });
    prisma.license.findMany.mockResolvedValue([{ id: 'lic-1' }]);

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    await expect(
      repo.migrateLicensesOffAccount('from', 'game-1'),
    ).rejects.toThrow(/targetAccountId is required/);
  });

  it('migrateLicensesOffAccount rejects locked or under-capacity targets', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === 'from') {
          return { id: 'from', gameId: 'game-1', activeUsersCount: 2 };
        }
        return {
          id: 'locked',
          gameId: 'game-1',
          maxActiveUsers: 50,
          activeUsersCount: 0,
          isActive: true,
          lockedUntil: new Date('2099-01-01T00:00:00.000Z'),
        };
      },
    );
    prisma.license.findMany.mockResolvedValue([{ id: 'lic-1' }, { id: 'lic-2' }]);

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    await expect(
      repo.migrateLicensesOffAccount('from', 'game-1', 'locked'),
    ).rejects.toThrow(/not claimable/);
  });

  it('migrateLicensesOffAccount rejects targets without enough open seats', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === 'from') {
          return { id: 'from', gameId: 'game-1', activeUsersCount: 3 };
        }
        return {
          id: 'small',
          gameId: 'game-1',
          maxActiveUsers: 50,
          activeUsersCount: 48,
          isActive: true,
          lockedUntil: null,
        };
      },
    );
    prisma.license.findMany.mockResolvedValue([
      { id: 'lic-1' },
      { id: 'lic-2' },
      { id: 'lic-3' },
    ]);

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    await expect(
      repo.migrateLicensesOffAccount('from', 'game-1', 'small'),
    ).rejects.toThrow(/2 open seats but 3 seats must move/);
  });

  it('migrateLicensesOffAccount unlinks without target when no licenses', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findUnique.mockResolvedValue({
      id: 'from',
      gameId: 'game-1',
      activeUsersCount: 0,
    });
    prisma.license.findMany.mockResolvedValue([]);
    prisma.game.findUnique.mockResolvedValue({ nextAccountId: null });
    prisma.gameAccount.update.mockResolvedValue({
      id: 'from',
      gameId: null,
      username: 'old',
    });

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const result = await repo.migrateLicensesOffAccount('from', 'game-1');

    expect(prisma.license.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ gameId: null });
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

  it('clearGuardLock clears lockedUntil and guard license', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.update = vi.fn().mockResolvedValue({
      id: 'acc-1',
      lockedUntil: null,
      guardLockedByLicenseId: null,
    });

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    await repo.clearGuardLock('acc-1');

    expect(prisma.gameAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: {
        lockedUntil: null,
        guardLockedByLicenseId: null,
      },
      select: expect.any(Object),
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

  it('findAvailableForAssignment returns the 3 newest accounts without search', async () => {
    const prisma = createPrismaMock();
    prisma.gameAccount.findMany.mockResolvedValue([
      { id: 'inv-3' },
      { id: 'inv-2' },
      { id: 'inv-1' },
    ]);

    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);
    const rows = await repo.findAvailableForAssignment();

    expect(prisma.gameAccount.findMany).toHaveBeenCalledWith({
      where: {
        gameId: null,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: expect.any(Object),
    });
    expect(rows).toHaveLength(3);
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
