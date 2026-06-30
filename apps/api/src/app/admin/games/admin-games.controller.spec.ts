import { describe, expect, it } from 'vitest';
import { AdminGamesController } from './admin-games.controller';

const expectedSetup = {
  status: 'setup',
  integration: 'admin-games',
  message: 'Admin games — not implemented yet',
};

describe('AdminGamesController', () => {
  const controller = new AdminGamesController();

  it('findAll returns setup JSON', () => {
    expect(controller.findAll()).toEqual(expectedSetup);
  });

  it('findOne returns setup JSON', () => {
    expect(controller.findOne('game-id')).toEqual(expectedSetup);
  });

  it('create returns setup JSON', () => {
    expect(controller.create({ title: 'Test' })).toEqual(expectedSetup);
  });

  it('update returns setup JSON', () => {
    expect(controller.update('game-id', { title: 'Test' })).toEqual(
      expectedSetup,
    );
  });

  it('remove returns setup JSON', () => {
    expect(controller.remove('game-id')).toEqual(expectedSetup);
  });
});
