import { describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { AdminLicensesController } from './admin-licenses.controller';
import type { AdminLicensesService } from './admin-licenses.service';

const sampleLicense = {
  id: 'license-1',
  licenseKey: 'GS-ABCD-EF12-3456',
  gameId: 'game-1',
  status: 'available',
  buyerEmail: 'buyer@example.com',
};

const sampleListItem = {
  id: 'license-1',
  licenseKeyMasked: 'GS-****-3456',
  gameTitle: 'Demo Game',
  ownerEmail: 'buyer@example.com',
  status: 'available',
};

describe('AdminLicensesController', () => {
  const licenses = {
    findAll: vi.fn().mockResolvedValue([sampleListItem]),
    findOne: vi.fn().mockResolvedValue({
      ...sampleLicense,
      gameTitle: 'Demo Game',
      buyerCountry: null,
      ownerEmail: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      activatedAt: null,
    }),
    update: vi.fn().mockResolvedValue({
      ...sampleLicense,
      buyerEmail: 'updated@example.com',
      gameTitle: 'Demo Game',
      buyerCountry: 'US',
      ownerEmail: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      activatedAt: null,
    }),
    generateKey: vi.fn().mockResolvedValue(sampleLicense),
    create: vi.fn().mockResolvedValue([sampleLicense]),
    revoke: vi.fn().mockResolvedValue({
      ...sampleLicense,
      status: 'revoked',
      gameTitle: 'Demo Game',
      buyerCountry: null,
      ownerEmail: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      activatedAt: null,
    }),
    remove: vi.fn().mockResolvedValue({ id: 'license-1', deleted: true as const }),
    bulkRevoke: vi.fn().mockResolvedValue({ succeeded: ['license-1'], failed: [] }),
    bulkDelete: vi.fn().mockResolvedValue({ succeeded: ['license-1'], failed: [] }),
  } satisfies AdminLicensesService;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } satisfies AuditLogService;

  const controller = new AdminLicensesController(licenses, auditLogService);
  const adminUser = { id: 'admin-1', clerkId: 'clerk-admin', role: 'admin' as const };
  const request = { headers: {}, ip: '127.0.0.1' };

  it('findAll returns admin licenses', async () => {
    await expect(controller.findAll()).resolves.toEqual([sampleListItem]);
    expect(licenses.findAll).toHaveBeenCalled();
  });

  it('generateKey records audit log', async () => {
    await expect(
      controller.generateKey({ gameId: 'game-1' }, adminUser, request as never),
    ).resolves.toEqual(sampleLicense);
    expect(licenses.generateKey).toHaveBeenCalledWith({ gameId: 'game-1' });
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.license.generate',
        resourceId: 'license-1',
      }),
    );
  });

  it('create records audit log', async () => {
    await expect(
      controller.create(
        { gameId: 'game-1', quantity: 1 },
        adminUser,
        request as never,
      ),
    ).resolves.toEqual(sampleLicense);
    expect(licenses.create).toHaveBeenCalledWith({ gameId: 'game-1', quantity: 1 });
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.license.create',
        resourceId: 'license-1',
      }),
    );
  });

  it('revoke records audit log', async () => {
    await expect(
      controller.revoke('license-1', adminUser, request as never),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'license-1',
        status: 'revoked',
      }),
    );
    expect(licenses.revoke).toHaveBeenCalledWith('license-1');
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.license.revoke',
        resourceId: 'license-1',
      }),
    );
  });

  it('update records audit log', async () => {
    const body = { buyerEmail: 'updated@example.com', buyerCountry: 'US' };
    await expect(
      controller.update('license-1', body, adminUser, request as never),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'license-1',
        buyerEmail: 'updated@example.com',
        buyerCountry: 'US',
      }),
    );
    expect(licenses.update).toHaveBeenCalledWith('license-1', body);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.license.update',
        resourceId: 'license-1',
      }),
    );
  });

  it('remove records audit log', async () => {
    await expect(
      controller.remove('license-1', adminUser, request as never),
    ).resolves.toEqual({ id: 'license-1', deleted: true });
    expect(licenses.remove).toHaveBeenCalledWith('license-1');
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.license.delete',
        resourceId: 'license-1',
      }),
    );
  });

  it('bulkRevoke records bulk audit log', async () => {
    await controller.bulkRevoke(
      { ids: ['license-1'] },
      adminUser,
      request as never,
    );
    expect(licenses.bulkRevoke).toHaveBeenCalledWith(['license-1']);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.license.bulk_revoke',
      }),
    );
  });
});
