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
  maxActiveUsers: 50,
  isActive: true,
  lockedUntil: null,
  guardLockedByLicenseId: null,
  lastHealthCheck: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  openSeats: 50,
  isClaimable: true,
  poolStatus: 'available' as const,
};

describe('AdminAccountsController', () => {
  const accounts = {
    findAll: vi.fn().mockResolvedValue([sampleAccount]),
    findOne: vi.fn().mockResolvedValue(sampleAccount),
    findAvailable: vi.fn().mockResolvedValue([sampleAccount]),
    create: vi.fn().mockResolvedValue(sampleAccount),
    assignToGame: vi.fn().mockResolvedValue(sampleAccount),
    unassignFromGame: vi.fn().mockResolvedValue({ ...sampleAccount, gameId: null, gameTitle: null }),
    update: vi.fn().mockResolvedValue({ ...sampleAccount, region: 'eu' }),
    clearGuardLock: vi.fn().mockResolvedValue({
      ...sampleAccount,
      lockedUntil: null,
      guardLockedByLicenseId: null,
      poolStatus: 'available' as const,
    }),
    deactivate: vi.fn().mockResolvedValue({ ...sampleAccount, isActive: false }),
    reactivate: vi.fn().mockResolvedValue(sampleAccount),
    remove: vi.fn().mockResolvedValue({ id: 'account-1', deleted: true as const }),
    bulkDeactivate: vi.fn().mockResolvedValue({ succeeded: ['account-1'], failed: [] }),
    bulkDelete: vi.fn().mockResolvedValue({ succeeded: ['account-1'], failed: [] }),
  } satisfies AdminAccountsService;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } satisfies AuditLogService;

  const controller = new AdminAccountsController(accounts, auditLogService);
  const adminUser = { id: 'admin-1', clerkId: 'clerk-admin', role: 'admin' as const };
  const request = { headers: {}, ip: '127.0.0.1' };

  it('findAll returns admin accounts and forwards filters', async () => {
    const filters = { gameId: 'game-1', q: 'pool', status: 'active' as const };
    await expect(controller.findAll(filters)).resolves.toEqual([sampleAccount]);
    expect(accounts.findAll).toHaveBeenCalledWith(filters);
  });

  it('findAvailable returns searchable inventory accounts', async () => {
    await expect(controller.findAvailable('pool')).resolves.toEqual([sampleAccount]);
    expect(accounts.findAvailable).toHaveBeenCalledWith('pool');
  });

  it('assign records audit log', async () => {
    await expect(
      controller.assign('account-1', { gameId: 'game-1' }, adminUser, request as never),
    ).resolves.toEqual(sampleAccount);
    expect(accounts.assignToGame).toHaveBeenCalledWith('account-1', { gameId: 'game-1' });
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.assign',
        resourceId: 'account-1',
      }),
    );
  });

  it('unassign records audit log with target metadata', async () => {
    await expect(
      controller.unassign(
        'account-1',
        { targetAccountId: 'account-2' },
        adminUser,
        request as never,
      ),
    ).resolves.toEqual({ ...sampleAccount, gameId: null, gameTitle: null });
    expect(accounts.unassignFromGame).toHaveBeenCalledWith('account-1', {
      targetAccountId: 'account-2',
    });
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.unassign',
        resourceId: 'account-1',
        metadata: expect.objectContaining({
          targetAccountId: 'account-2',
          occupiedSeats: 0,
        }),
      }),
    );
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

  it('deactivate records audit log with unassign metadata', async () => {
    await expect(
      controller.deactivate(
        'account-1',
        { targetAccountId: 'account-2' },
        adminUser,
        request as never,
      ),
    ).resolves.toEqual({ ...sampleAccount, isActive: false });
    expect(accounts.deactivate).toHaveBeenCalledWith('account-1', {
      targetAccountId: 'account-2',
    });
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.deactivate',
        resourceId: 'account-1',
        metadata: expect.objectContaining({
          targetAccountId: 'account-2',
          unassigned: true,
        }),
      }),
    );
  });

  it('update records audit log', async () => {
    const body = { region: 'eu' };

    await expect(
      controller.update('account-1', body, adminUser, request as never),
    ).resolves.toEqual({ ...sampleAccount, region: 'eu' });
    expect(accounts.update).toHaveBeenCalledWith('account-1', body);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.update',
        resourceId: 'account-1',
      }),
    );
  });

  it('clearGuardLock records audit log', async () => {
    await expect(
      controller.clearGuardLock('account-1', adminUser, request as never),
    ).resolves.toEqual({
      ...sampleAccount,
      lockedUntil: null,
      guardLockedByLicenseId: null,
      poolStatus: 'available',
    });
    expect(accounts.clearGuardLock).toHaveBeenCalledWith('account-1');
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.clear_guard_lock',
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

  it('bulkDelete records bulk audit log', async () => {
    await controller.bulkDelete(
      { ids: ['account-1'] },
      adminUser,
      request as never,
    );
    expect(accounts.bulkDelete).toHaveBeenCalledWith(['account-1']);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.account.bulk_delete',
      }),
    );
  });
});
