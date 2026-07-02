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
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
    },
    license: {
      count: vi.fn().mockResolvedValue(0),
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

  it('findAll filters by gameId when provided', async () => {
    const prisma = createPrismaMock();
    const repo = new GameAccountsRepository(prisma as unknown as PrismaService);

    await repo.findAll('game-1');

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

  it('countActivatedLicenses filters by account and status', async () => {
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
});
