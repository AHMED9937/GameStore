import { describe, expect, it } from 'vitest';
import { AdminAuditController } from './admin-audit.controller';

describe('AdminAuditController', () => {
  const controller = new AdminAuditController();

  it('list returns setup JSON', () => {
    expect(controller.list('1', '20', 'admin.game.create')).toEqual({
      status: 'setup',
      integration: 'admin-audit',
      message: 'Admin audit log — not implemented yet',
    });
  });
});
