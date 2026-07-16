import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { LicensesRepository } from './licenses.repository';

function createPrismaMock() {
  return {
    license: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'new' }),
      update: vi.fn().mockResolvedValue({ id: 'updated' }),
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
    },
  };
}

describe('LicensesRepository', () => {
  it('findByKey looks up the key and includes a game summary', async () => {
    const prisma = createPrismaMock();
    const repo = new LicensesRepository(prisma as unknown as PrismaService);

    await repo.findByKey('DEMO-KEY-0001');

    expect(prisma.license.findUnique).toHaveBeenCalledWith({
      where: { licenseKey: 'DEMO-KEY-0001' },
      include: {
        game: { select: { id: true, title: true, slug: true, coverImage: true, coverCardImage: true } },
        account: true,
      },
    });
  });

  it('findActiveByOwnerAndGame filters by owner, game, and non-revoked status', async () => {
    const prisma = createPrismaMock();
    const repo = new LicensesRepository(prisma as unknown as PrismaService);

    await repo.findActiveByOwnerAndGame('user-a', 'game-1');

    expect(prisma.license.findFirst).toHaveBeenCalledWith({
      where: { ownerId: 'user-a', gameId: 'game-1', status: { not: 'revoked' } },
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, stripeSessionId: true } },
      },
    });
  });

  it('findByOwnerId Filters by owner', async () => {
    const prisma = createPrismaMock();
    const repo = new LicensesRepository(prisma as unknown as PrismaService);

    await repo.findByOwnerId('user-a');

    expect(prisma.license.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'user-a' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        licenseKey: true,
        status: true,
        source: true,
        expiresAt: true,
        validFrom: true,
        game: { select: { id: true, title: true, slug: true, coverImage: true, coverCardImage: true } },
      },
    });
  });

  it('findAll includes game summary and owner email', async () => {
    const prisma = createPrismaMock();
    const repo = new LicensesRepository(prisma as unknown as PrismaService);

    await repo.findAll();

    expect(prisma.license.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      include: {
        game: { select: { id: true, title: true, slug: true, coverImage: true, coverCardImage: true } },
        owner: { select: { email: true } },
      },
    });
  });

  it('findAll applies combined Filters', async () => {
    const prisma = createPrismaMock();
    const repo = new LicensesRepository(prisma as unknown as PrismaService);

    await repo.findAll({
      game: 'Demo',
      source: 'admin',
      owner: 'owner@example.com',
      status: 'available',
      expires: 'expired',
    });

    expect(prisma.license.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          game: {
            title: {
              contains: 'Demo',
              mode: 'insensitive',
            },
          },
          source: {
            equals: 'admin',
            mode: 'insensitive',
          },
          status: {
            equals: 'available',
            mode: 'insensitive',
          },
          OR: [
            {
              owner: {
                email: {
                  contains: 'owner@example.com',
                  mode: 'insensitive',
                },
              },
            },
            {
              buyerEmail: {
                contains: 'owner@example.com',
                mode: 'insensitive',
              },
            },
          ],
          expiresAt: {
            lte: expect.any(Date),
          },
        }),
      }),
    );
  });

  it('revoke sets status to revoked', async () => {
    const prisma = createPrismaMock();
    const repo = new LicensesRepository(prisma as unknown as PrismaService);

    await repo.revoke('lic-1');

    expect(prisma.license.update).toHaveBeenCalledWith({
      where: { id: 'lic-1' },
      data: { status: 'revoked' },
    });
  });

  it('update patches buyer metadata and includes relations', async () => {
    const prisma = createPrismaMock();
    const repo = new LicensesRepository(prisma as unknown as PrismaService);

    await repo.update('lic-1', {
      buyerEmail: 'buyer@example.com',
      buyerCountry: 'US',
    });

    expect(prisma.license.update).toHaveBeenCalledWith({
      where: { id: 'lic-1' },
      data: {
        buyerEmail: 'buyer@example.com',
        buyerCountry: 'US',
      },
      include: {
        game: { select: { id: true, title: true, slug: true, coverImage: true, coverCardImage: true } },
        owner: { select: { email: true } },
      },
    });
  });

  it('delete removes the license row', async () => {
    const prisma = createPrismaMock();
    const repo = new LicensesRepository(prisma as unknown as PrismaService);

    await repo.delete('lic-1');

    expect(prisma.license.delete).toHaveBeenCalledWith({
      where: { id: 'lic-1' },
      select: { id: true },
    });
  });
});
