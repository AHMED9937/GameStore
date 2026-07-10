import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';
import { buildContainsFilter, normalizeSearchTerm } from './admin-list-filters';

export type AuditLogsQuery = {
  page?: number;
  limit?: number;
  action?: string;
  q?: string;
};

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaginated(query: AuditLogsQuery = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    const q = normalizeSearchTerm(query.q);
    if (q) {
      where.OR = [
        { action: buildContainsFilter(q)! },
        { resource: buildContainsFilter(q)! },
        { user: { email: buildContainsFilter(q)! } },
      ];
    } else if (query.action) {
      where.action = query.action;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
