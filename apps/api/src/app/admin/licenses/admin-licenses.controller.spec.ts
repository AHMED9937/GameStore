import { describe, expect, it } from 'vitest';
import { AdminLicensesController } from './admin-licenses.controller';

const expectedSetup = {
  status: 'setup',
  integration: 'admin-licenses',
  message: 'Admin licenses — not implemented yet',
};

describe('AdminLicensesController', () => {
  const controller = new AdminLicensesController();

  it('findAll returns setup JSON', () => {
    expect(controller.findAll()).toEqual(expectedSetup);
  });

  it('findOne returns setup JSON', () => {
    expect(controller.findOne('license-id')).toEqual(expectedSetup);
  });

  it('create returns setup JSON', () => {
    expect(controller.create({ licenseKey: 'TEST-KEY' })).toEqual(
      expectedSetup,
    );
  });

  it('generateKey returns setup JSON', () => {
    expect(controller.generateKey()).toEqual(expectedSetup);
  });

  it('revoke returns setup JSON', () => {
    expect(controller.revoke('license-id')).toEqual(expectedSetup);
  });
});
