import { describe, expect, it } from 'vitest';
import { AdminOrdersController } from './admin-orders.controller';

describe('AdminOrdersController', () => {
  const controller = new AdminOrdersController();

  it('findAll returns setup JSON', () => {
    expect(controller.findAll()).toEqual({
      status: 'setup',
      integration: 'admin-orders',
      message: 'Admin orders — not implemented yet',
    });
  });
});
