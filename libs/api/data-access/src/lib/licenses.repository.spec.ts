import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { LicensesRepository } from './licenses.repository';

function createPrismaMock() {
  return {
    license: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'new' }),
      update: vi.fn().mockResolvedValue({ id: 'updated' }),
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
      include: { game: { select: { id: true, title: true, slug: true } } },
    });
  });

  it('findByOwnerId filters by owner', async () => {
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
        game: { select: { id: true, title: true, slug: true } },
      },
    });
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
});
