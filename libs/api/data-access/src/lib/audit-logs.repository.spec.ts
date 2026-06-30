import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { AuditLogsRepository } from './audit-logs.repository';

describe('AuditLogsRepository', () => {
  it('findPaginated returns items and pagination metadata', async () => {
    const prisma = {
      $transaction: vi.fn().mockResolvedValue([2, [{ id: 'log-1' }]]),
      auditLog: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const repo = new AuditLogsRepository(prisma as unknown as PrismaService);
    const result = await repo.findPaginated({ page: 1, limit: 25, action: 'auth.forbidden' });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      items: [{ id: 'log-1' }],
      total: 2,
      page: 1,
      limit: 25,
      totalPages: 1,
    });
  });
});
