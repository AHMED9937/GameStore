import { describe, expect, it } from 'vitest';
import { AdminDashboardController } from './admin-dashboard.controller';

describe('AdminDashboardController', () => {
  const controller = new AdminDashboardController();

  it('getStats returns setup JSON', () => {
    expect(controller.getStats()).toEqual({
      status: 'setup',
      integration: 'admin-dashboard',
      message: 'Admin dashboard — not implemented yet',
    });
  });
});
