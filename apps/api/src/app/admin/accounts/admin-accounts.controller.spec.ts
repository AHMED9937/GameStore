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
    deactivate: vi.fn().mockResolvedValue({ ...sampleAccount, isActive: false }),
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
});
