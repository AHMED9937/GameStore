import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { UsersRepository } from './users.repository';

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({
        id: 'usr_1',
        clerkId: 'user_clerk',
        email: 'player@example.com',
        role: 'user',
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

describe('UsersRepository', () => {
  it('upsertFromClerkWebhookUser maps Clerk payload to upsert input', async () => {
    const prisma = createPrismaMock();
    const repo = new UsersRepository(prisma as unknown as PrismaService);

    await repo.upsertFromClerkWebhookUser({
      id: 'user_clerk',
      primary_email_address_id: 'eml_1',
      email_addresses: [{ id: 'eml_1', email_address: 'player@example.com' }],
      public_metadata: { role: 'admin' },
    });

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { clerkId: 'user_clerk' },
      create: {
        clerkId: 'user_clerk',
        email: 'player@example.com',
        role: 'admin',
        firstName: null,
        lastName: null,
      },
      update: {
        email: 'player@example.com',
        role: 'admin',
        firstName: null,
        lastName: null,
      },
    });
  });

  it('deleteByClerkId removes by clerkId', async () => {
    const prisma = createPrismaMock();
    const repo = new UsersRepository(prisma as unknown as PrismaService);

    await repo.deleteByClerkId('user_clerk');

    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: { clerkId: 'user_clerk' },
    });
  });
});
