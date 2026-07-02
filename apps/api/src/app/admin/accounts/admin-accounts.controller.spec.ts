import { describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { AdminAccountsController } from './admin-accounts.controller';
import type { AdminAccountsService } from './admin-accounts.service';

const sampleAccount = {
  id: 'account-1',
  gameId: 'game-1',
  gameTitle: 'Demo Game',
  username: 'pool_user',
  platform: 'steam',
  region: 'global',
  activeUsersCount: 0,
  isActive: true,
};

describe('AdminAccountsController', () => {
  const accounts = {
    findAll: vi.fn().mockResolvedValue([sampleAccount]),
    findOne: vi.fn().mockResolvedValue(sampleAccount),
    create: vi.fn().mockResolvedValue(sampleAccount),
    update: vi.fn().mockResolvedValue({ ...sampleAccount, username: 'pool_user_2' }),
    deactivate: vi.fn().mockResolvedValue({ ...sampleAccount, isActive: false }),
    reactivate: vi.fn().mockResolvedValue(sampleAccount),
    remove: vi.fn().mockResolvedValue({ id: 'account-1', deleted: true as const }),
    bulkDeactivate: vi.fn().mockResolvedValue({ succeeded: ['account-1'], failed: [] }),
  } satisfies AdminAccountsService;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } satisfies AuditLogService;

  const controller = new AdminAccountsController(accounts, auditLogService);
  const adminUser = { id: 'admin-1', clerkId: 'clerk-admin', role: 'admin' as const };
  const request = { headers: {}, ip: '127.0.0.1' };

  it('findAll returns admin accounts', async () => {
    await expect(controller.findAll('game-1')).resolves.toEqual([sampleAccount]);
    expect(accounts.findAll).toHaveBeenCalledWith('game-1');
  });

  it('findOne returns an account by id', async () => {
    await expect(controller.findOne('account-1')).resolves.toEqual(sampleAccount);
    expect(accounts.findOne).toHaveBeenCalledWith('account-1');
  });

  it('create records audit log', async () => {
    const body = {
      gameId: 'game-1',
      username: 'pool_user',
      password: 'secret',
      sharedSecret: 'shared',
    };

    await expect(
      controller.create(body, adminUser, request as never),
    ).resolves.toEqual(sampleAccount);
    expect(accounts.create).toHaveBeenCalledWith(body);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.create',
        resourceId: 'account-1',
      }),
    );
  });

  it('deactivate records audit log', async () => {
    await expect(
      controller.deactivate('account-1', adminUser, request as never),
    ).resolves.toEqual({ ...sampleAccount, isActive: false });
    expect(accounts.deactivate).toHaveBeenCalledWith('account-1');
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.deactivate',
        resourceId: 'account-1',
      }),
    );
  });

  it('update records audit log', async () => {
    const body = { username: 'pool_user_2', region: 'eu' };

    await expect(
      controller.update('account-1', body, adminUser, request as never),
    ).resolves.toEqual({ ...sampleAccount, username: 'pool_user_2' });
    expect(accounts.update).toHaveBeenCalledWith('account-1', body);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.update',
        resourceId: 'account-1',
      }),
    );
  });

  it('reactivate records audit log', async () => {
    await expect(
      controller.reactivate('account-1', adminUser, request as never),
    ).resolves.toEqual(sampleAccount);
    expect(accounts.reactivate).toHaveBeenCalledWith('account-1');
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.reactivate',
        resourceId: 'account-1',
      }),
    );
  });

  it('remove records audit log', async () => {
    await expect(
      controller.remove('account-1', adminUser, request as never),
    ).resolves.toEqual({ id: 'account-1', deleted: true });
    expect(accounts.remove).toHaveBeenCalledWith('account-1');
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.delete',
        resourceId: 'account-1',
      }),
    );
  });

  it('bulkDeactivate records bulk audit log', async () => {
    await controller.bulkDeactivate(
      { ids: ['account-1'] },
      adminUser,
      request as never,
    );
    expect(accounts.bulkDeactivate).toHaveBeenCalledWith(['account-1']);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.bulk_deactivate',
      }),
    );
  });
});
