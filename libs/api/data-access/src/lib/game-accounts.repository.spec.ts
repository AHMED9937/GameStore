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
});
