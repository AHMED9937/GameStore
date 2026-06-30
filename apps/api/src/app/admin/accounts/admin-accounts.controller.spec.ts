import { describe, expect, it } from 'vitest';
import { AdminAccountsController } from './admin-accounts.controller';

const expectedSetup = {
  status: 'setup',
  integration: 'admin-accounts',
  message: 'Admin accounts — not implemented yet',
};

describe('AdminAccountsController', () => {
  const controller = new AdminAccountsController();

  it('findAll returns setup JSON', () => {
    expect(controller.findAll()).toEqual(expectedSetup);
  });

  it('findOne returns setup JSON', () => {
    expect(controller.findOne('account-id')).toEqual(expectedSetup);
  });

  it('create returns setup JSON', () => {
    expect(
      controller.create({
        gameId: 'game-id',
        username: 'user',
        platform: 'steam',
      }),
    ).toEqual(expectedSetup);
  });

  it('deactivate returns setup JSON', () => {
    expect(controller.deactivate('account-id')).toEqual(expectedSetup);
  });
});
