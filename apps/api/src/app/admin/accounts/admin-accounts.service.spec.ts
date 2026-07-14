import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { GamesRepository, GameAccountsRepository } from '@gamestore/api/data-access';
import { GameAccountsService } from '../../game-accounts/game-accounts.service';
import type { EntitlementCleanupService } from '../../entitlements/entitlement-cleanup.service';
import { AdminAccountsService } from './admin-accounts.service';

describe('AdminAccountsService', () => {
  const steamGame = {
    id: 'game-steam',
    title: 'Steam Game',
    platform: 'steam',
  };
  const microsoftGame = {
    id: 'game-ms',
    title: 'MS Game',
    platform: 'microsoft',
  };

  const games = {
    findById: vi.fn(),
  } satisfies Pick<GamesRepository, 'findById'>;

  const gameAccounts = {
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    reactivate: vi.fn(),
    remove: vi.fn(),
  } satisfies Pick<
    GameAccountsService,
    'findOne' | 'create' | 'update' | 'deactivate' | 'reactivate' | 'remove'
  >;

  const accounts = {
    findAll: vi.fn(),
    findAvailableForAssignment: vi.fn(),
    assignToGame: vi.fn(),
    unassignFromGame: vi.fn(),
    countActivatedLicenses: vi.fn(),
    getNextAccountId: vi.fn().mockResolvedValue(null),
    setNextAccountId: vi.fn().mockResolvedValue({ id: 'game-steam', nextAccountId: 'account-1' }),
    migrateLicensesOffAccount: vi.fn(),
    advanceNextAccountIfFull: vi.fn().mockResolvedValue(null),
    clearGuardLock: vi.fn(),
  } satisfies Pick<
    GameAccountsRepository,
    | 'findAll'
    | 'findAvailableForAssignment'
    | 'assignToGame'
    | 'unassignFromGame'
    | 'countActivatedLicenses'
    | 'getNextAccountId'
    | 'setNextAccountId'
    | 'migrateLicensesOffAccount'
    | 'advanceNextAccountIfFull'
    | 'clearGuardLock'
  >;

  const entitlementCleanup = {
    deactivateAccountWithCleanup: vi.fn(),
  } satisfies Pick<EntitlementCleanupService, 'deactivateAccountWithCleanup'>;

  let service: AdminAccountsService;

  beforeEach(() => {
    service = new AdminAccountsService(
      games as GamesRepository,
      gameAccounts as GameAccountsService,
      accounts as GameAccountsRepository,
      entitlementCleanup as EntitlementCleanupService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects create for non-Steam games', async () => {
    games.findById.mockResolvedValue(microsoftGame);

    await expect(
      service.create({
        gameId: microsoftGame.id,
        username: 'pool-user',
        password: 'pass',
        sharedSecret: 'secret',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(gameAccounts.create).not.toHaveBeenCalled();
  });

  it('creates pool accounts for Steam games', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.create.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });

    const result = await service.create({
      gameId: steamGame.id,
      username: 'pool-user',
      password: 'pass',
      sharedSecret: 'secret',
    });

    expect(result.gameTitle).toBe('Steam Game');
    expect(result.poolStatus).toBe('available');
    expect(result.isClaimable).toBe(true);
    expect(result.openSeats).toBe(50);
    expect(gameAccounts.create).toHaveBeenCalledWith({
      gameId: steamGame.id,
      platform: 'steam',
      username: 'pool-user',
      password: 'pass',
      sharedSecret: 'secret',
      region: undefined,
    });
  });

  it('creates unassigned inventory accounts without a game', async () => {
    gameAccounts.create.mockResolvedValue({
      id: 'account-inv',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });

    const result = await service.create({
      username: 'pool-user',
      password: 'pass',
      sharedSecret: 'secret',
    });

    expect(result.gameId).toBeNull();
    expect(result.gameTitle).toBeNull();
    expect(games.findById).not.toHaveBeenCalled();
    expect(gameAccounts.create).toHaveBeenCalledWith({
      platform: 'steam',
      username: 'pool-user',
      password: 'pass',
      sharedSecret: 'secret',
      region: undefined,
    });
  });

  it('assigns an available account to a Steam game', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });
    accounts.assignToGame.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });

    const result = await service.assignToGame('account-1', { gameId: steamGame.id });

    expect(result.gameId).toBe(steamGame.id);
    expect(accounts.assignToGame).toHaveBeenCalledWith('account-1', steamGame.id);
  });

  it('rejects assign when account already has a game', async () => {
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });

    await expect(
      service.assignToGame('account-1', { gameId: steamGame.id }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('unassigns by migrating licenses onto the chosen target', async () => {
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 2,
      maxActiveUsers: 50,
      isActive: true,
    });
    accounts.migrateLicensesOffAccount.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });

    const result = await service.unassignFromGame('account-1', {
      targetAccountId: 'account-2',
    });

    expect(result.gameId).toBeNull();
    expect(accounts.migrateLicensesOffAccount).toHaveBeenCalledWith(
      'account-1',
      steamGame.id,
      'account-2',
    );
  });

  it('rejects unassign when occupied seats lack a target account', async () => {
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 2,
      maxActiveUsers: 50,
      isActive: true,
    });

    await expect(service.unassignFromGame('account-1')).rejects.toThrow(
      /targetAccountId is required/,
    );
    expect(accounts.migrateLicensesOffAccount).not.toHaveBeenCalled();
  });

  it('rejects unassign when migration has no destination capacity', async () => {
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 2,
      maxActiveUsers: 50,
      isActive: true,
    });
    accounts.migrateLicensesOffAccount.mockRejectedValue(
      new Error(
        'Cannot unassign: target has 0 open seats but 2 seats must move',
      ),
    );

    await expect(
      service.unassignFromGame('account-1', { targetAccountId: 'account-2' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('assigns and sets nextAccountId when game has none', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });
    accounts.assignToGame.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });
    accounts.getNextAccountId.mockResolvedValue(null);

    await service.assignToGame('account-1', { gameId: steamGame.id });

    expect(accounts.setNextAccountId).toHaveBeenCalledWith(
      steamGame.id,
      'account-1',
    );
  });

  it('findAvailable returns searchable inventory accounts', async () => {
    accounts.findAvailableForAssignment.mockResolvedValue([
      {
        id: 'account-1',
        gameId: null,
        username: 'pool-alpha',
        platform: 'steam',
        region: 'global',
        activeUsersCount: 0,
        maxActiveUsers: 50,
        isActive: true,
      },
    ]);

    const result = await service.findAvailable('alpha');

    expect(accounts.findAvailableForAssignment).toHaveBeenCalledWith('alpha');
    expect(result[0]).toMatchObject({
      gameId: null,
      gameTitle: null,
      username: 'pool-alpha',
    });
  });

  it('updates pool accounts for Steam games without changing username', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });
    gameAccounts.update.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'eu',
      activeUsersCount: 0,
      maxActiveUsers: 25,
      isActive: true,
    });

    const result = await service.update('account-1', {
      region: 'eu',
      maxActiveUsers: 25,
    });

    expect(result.username).toBe('pool-user');
    expect(result.maxActiveUsers).toBe(25);
    expect(gameAccounts.update).toHaveBeenCalledWith('account-1', {
      region: 'eu',
      maxActiveUsers: 25,
    });
  });

  it('rejects maxActiveUsers below occupied seats', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 10,
      maxActiveUsers: 50,
      isActive: true,
    });

    await expect(
      service.update('account-1', { maxActiveUsers: 5 }),
    ).rejects.toThrow(/cannot be below occupied seats \(10\)/);
    expect(gameAccounts.update).not.toHaveBeenCalled();
  });

  it('clears Steam Guard lock via repository', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 1,
      maxActiveUsers: 50,
      isActive: true,
      lockedUntil: new Date('2099-01-01T00:00:00.000Z'),
      guardLockedByLicenseId: 'license-1',
    });
    accounts.clearGuardLock.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 1,
      maxActiveUsers: 50,
      isActive: true,
      lockedUntil: null,
      guardLockedByLicenseId: null,
      lastHealthCheck: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    const result = await service.clearGuardLock('account-1');

    expect(accounts.clearGuardLock).toHaveBeenCalledWith('account-1');
    expect(result.poolStatus).toBe('available');
    expect(result.lockedUntil).toBeNull();
    expect(result.guardLockedByLicenseId).toBeNull();
  });

  it('maps createdAt, lastHealthCheck, and guard lock license on DTO', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 1,
      maxActiveUsers: 50,
      isActive: true,
      lockedUntil: new Date('2099-01-01T00:00:00.000Z'),
      guardLockedByLicenseId: 'license-guard-1',
      lastHealthCheck: new Date('2026-06-01T12:00:00.000Z'),
      createdAt: new Date('2025-01-15T08:30:00.000Z'),
    });

    const result = await service.findOne('account-1');

    expect(result.createdAt).toBe('2025-01-15T08:30:00.000Z');
    expect(result.lastHealthCheck).toBe('2026-06-01T12:00:00.000Z');
    expect(result.guardLockedByLicenseId).toBe('license-guard-1');
    expect(result.poolStatus).toBe('locked');
  });

  it('reactivates inactive pool accounts', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: false,
    });
    gameAccounts.reactivate.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });

    const result = await service.reactivate('account-1');

    expect(result.isActive).toBe(true);
    expect(gameAccounts.reactivate).toHaveBeenCalledWith('account-1');
  });

  it('remove delegates to game accounts service', async () => {
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });
    gameAccounts.remove.mockResolvedValue({ id: 'account-1', deleted: true });

    await expect(service.remove('account-1')).resolves.toEqual({
      id: 'account-1',
      deleted: true,
    });
    expect(gameAccounts.remove).toHaveBeenCalledWith('account-1');
  });

  it('bulkDeactivate deactivates empty accounts and skips occupied ones', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne
      .mockResolvedValueOnce({
        id: 'account-1',
        gameId: steamGame.id,
        username: 'pool-user',
        platform: 'steam',
        region: 'global',
        activeUsersCount: 0,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      })
      .mockResolvedValueOnce({
        id: 'account-1',
        gameId: steamGame.id,
        username: 'pool-user',
        platform: 'steam',
        region: 'global',
        activeUsersCount: 0,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      })
      .mockResolvedValueOnce({
        id: 'account-2',
        gameId: steamGame.id,
        username: 'busy-user',
        platform: 'steam',
        region: 'global',
        activeUsersCount: 3,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      });
    accounts.migrateLicensesOffAccount.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });
    entitlementCleanup.deactivateAccountWithCleanup.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: false,
      lockedUntil: null,
    });

    await expect(
      service.bulkDeactivate(['account-1', 'account-2']),
    ).resolves.toEqual({
      succeeded: ['account-1'],
      failed: [
        {
          id: 'account-2',
          reason:
            'Account has occupied seats. Open account edit to move seats, then deactivate.',
        },
      ],
    });
    expect(entitlementCleanup.deactivateAccountWithCleanup).toHaveBeenCalledTimes(1);
  });

  it('deactivate unassigns first then soft-deactivates', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
      lockedUntil: null,
    });
    accounts.migrateLicensesOffAccount.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });
    entitlementCleanup.deactivateAccountWithCleanup.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: false,
      lockedUntil: null,
    });

    const result = await service.deactivate('account-1');

    expect(accounts.migrateLicensesOffAccount).toHaveBeenCalledWith(
      'account-1',
      steamGame.id,
      undefined,
    );
    expect(entitlementCleanup.deactivateAccountWithCleanup).toHaveBeenCalledWith(
      'account-1',
    );
    expect(result.isActive).toBe(false);
    expect(result.gameId).toBeNull();
  });

  it('deactivate requires target when seats are occupied', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 2,
      maxActiveUsers: 50,
      isActive: true,
    });

    await expect(service.deactivate('account-1')).rejects.toThrow(
      /targetAccountId is required/,
    );
    expect(accounts.migrateLicensesOffAccount).not.toHaveBeenCalled();
  });

  it('deactivate migrates occupied seats to the chosen target', async () => {
    games.findById.mockResolvedValue(steamGame);
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 2,
      maxActiveUsers: 50,
      isActive: true,
    });
    accounts.migrateLicensesOffAccount.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });
    entitlementCleanup.deactivateAccountWithCleanup.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: false,
    });

    await service.deactivate('account-1', { targetAccountId: 'account-2' });

    expect(accounts.migrateLicensesOffAccount).toHaveBeenCalledWith(
      'account-1',
      steamGame.id,
      'account-2',
    );
  });

  it('maps full and locked pool statuses on DTO', async () => {
    gameAccounts.findOne
      .mockResolvedValueOnce({
        id: 'full-1',
        gameId: steamGame.id,
        username: 'full-user',
        platform: 'steam',
        region: 'global',
        activeUsersCount: 50,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: null,
      })
      .mockResolvedValueOnce({
        id: 'locked-1',
        gameId: steamGame.id,
        username: 'locked-user',
        platform: 'steam',
        region: 'global',
        activeUsersCount: 1,
        maxActiveUsers: 50,
        isActive: true,
        lockedUntil: new Date('2099-01-01T00:00:00.000Z'),
      });
    games.findById.mockResolvedValue(steamGame);

    const full = await service.findOne('full-1');
    expect(full.poolStatus).toBe('full');
    expect(full.isClaimable).toBe(false);

    const locked = await service.findOne('locked-1');
    expect(locked.poolStatus).toBe('locked');
    expect(locked.isClaimable).toBe(false);
    expect(locked.lockedUntil).toBe('2099-01-01T00:00:00.000Z');
  });

  it('bulkDelete removes each deletable account', async () => {
    gameAccounts.findOne.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: false,
    });
    gameAccounts.remove.mockResolvedValue({ id: 'account-1', deleted: true });

    await expect(service.bulkDelete(['account-1', 'account-2'])).resolves.toEqual({
      succeeded: ['account-1', 'account-2'],
      failed: [],
    });
    expect(gameAccounts.remove).toHaveBeenCalledTimes(2);
  });
});
