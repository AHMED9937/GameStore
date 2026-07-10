import { describe, expect, it, vi } from 'vitest';
import { AdminAuditService } from './admin-audit.service';
import type { AuditLogsService } from '../../audit-logs/audit-logs.service';

describe('AdminAuditService', () => {
  const auditLogs = {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'log-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          action: 'admin.game.create',
          resource: 'game',
          user: { email: 'admin@example.com' },
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
  } satisfies AuditLogsService;

  const service = new AdminAuditService(auditLogs);

  it('maps paginated audit logs for admin list', async () => {
    await expect(service.list({ q: '  game ', page: '1', limit: '20' })).resolves.toEqual({
      items: [
        {
          id: 'log-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          actorEmail: 'admin@example.com',
          action: 'admin.game.create',
          resource: 'game',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(auditLogs.list).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: 'game',
    });
  });
});
