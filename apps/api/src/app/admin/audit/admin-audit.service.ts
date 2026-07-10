import { Injectable } from '@nestjs/common';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { normalizeSearchTerm } from '@gamestore/api/data-access';
import type { AdminAuditListFiltersDto } from './admin-audit-list-filters.dto';

export type AdminAuditLogListItemDto = {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  resource: string;
};

export type AdminAuditLogListResponseDto = {
  items: AdminAuditLogListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class AdminAuditService {
  constructor(private readonly auditLogs: AuditLogsService) {}

  async list(filters?: AdminAuditListFiltersDto): Promise<AdminAuditLogListResponseDto> {
    const page = Math.max(1, Number.parseInt(filters?.page ?? '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(filters?.limit ?? '20', 10) || 20),
    );
    const q = normalizeSearchTerm(filters?.q);

    const result = await this.auditLogs.list({
      page,
      limit,
      ...(q ? { q } : {}),
    });

    return {
      items: result.items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        actorEmail: item.user?.email ?? '—',
        action: item.action,
        resource: item.resource ?? '—',
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
