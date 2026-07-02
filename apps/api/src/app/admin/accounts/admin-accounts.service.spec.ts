import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { GamesRepository, GameAccountsRepository } from '@gamestore/api/data-access';
import { GameAccountsService } from '../../game-accounts/game-accounts.service';
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
  } satisfies Pick<GameAccountsRepository, 'findAll'>;

  let service: AdminAccountsService;

  beforeEach(() => {
    service = new AdminAccountsService(
      games as GamesRepository,
      gameAccounts as GameAccountsService,
      accounts as GameAccountsRepository,
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

  it('bulkDeactivate deactivates each account', async () => {
    gameAccounts.deactivate.mockResolvedValue({
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
    expect(gameAccounts.deactivate).toHaveBeenCalledTimes(2);
  });
});
