import { describe, expect, it, vi } from 'vitest';
import { AdminAuditController } from './admin-audit.controller';
import type { AdminAuditService } from './admin-audit.service';

describe('AdminAuditController', () => {
  const audit = {
    list: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    }),
  } satisfies AdminAuditService;

  const controller = new AdminAuditController(audit);

  it('list forwards filters to service', async () => {
    const filters = { q: 'admin.game.create', page: '2', limit: '10' };
    await controller.list(filters);
    expect(audit.list).toHaveBeenCalledWith(filters);
  });
});
