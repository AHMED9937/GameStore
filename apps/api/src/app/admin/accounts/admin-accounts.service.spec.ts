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
  } satisfies Pick<
    GameAccountsRepository,
    | 'findAll'
    | 'findAvailableForAssignment'
    | 'assignToGame'
    | 'unassignFromGame'
    | 'countActivatedLicenses'
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

  it('rejects unassign when account is still active', async () => {
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

    await expect(service.unassignFromGame('account-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('unassigns an inactive unused account from a game', async () => {
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
    accounts.countActivatedLicenses.mockResolvedValue(0);
    accounts.unassignFromGame.mockResolvedValue({
      id: 'account-1',
      gameId: null,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: true,
    });

    const result = await service.unassignFromGame('account-1');

    expect(result.gameId).toBeNull();
    expect(accounts.unassignFromGame).toHaveBeenCalledWith('account-1');
  });

  it('rejects unassign when account has active users', async () => {
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

    await expect(service.unassignFromGame('account-1')).rejects.toBeInstanceOf(
      BadRequestException,
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

  it('updates pool accounts for Steam games', async () => {
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
      username: 'pool-user-renamed',
      platform: 'steam',
      region: 'eu',
      activeUsersCount: 0,
      maxActiveUsers: 25,
      isActive: true,
    });

    const result = await service.update('account-1', {
      username: 'pool-user-renamed',
      region: 'eu',
      maxActiveUsers: 25,
    });

    expect(result.username).toBe('pool-user-renamed');
    expect(result.maxActiveUsers).toBe(25);
    expect(gameAccounts.update).toHaveBeenCalledWith('account-1', {
      username: 'pool-user-renamed',
      region: 'eu',
      maxActiveUsers: 25,
    });
  });

  it('reactivates inactive pool accounts', async () => {
    games.findById.mockResolvedValue(steamGame);
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

  it('bulkDeactivate deactivates each account with cleanup', async () => {
    games.findById.mockResolvedValue(steamGame);
    entitlementCleanup.deactivateAccountWithCleanup.mockResolvedValue({
      id: 'account-1',
      gameId: steamGame.id,
      username: 'pool-user',
      platform: 'steam',
      region: 'global',
      activeUsersCount: 0,
      maxActiveUsers: 50,
      isActive: false,
    });

    await expect(
      service.bulkDeactivate(['account-1', 'account-2']),
    ).resolves.toEqual({
      succeeded: ['account-1', 'account-2'],
      failed: [],
    });
    expect(entitlementCleanup.deactivateAccountWithCleanup).toHaveBeenCalledTimes(2);
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
