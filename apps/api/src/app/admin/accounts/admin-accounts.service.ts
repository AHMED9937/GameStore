import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GamesRepository, GameAccountsRepository } from '@gamestore/api/data-access';
import { GameAccountsService } from '../../game-accounts/game-accounts.service';

export type AdminAccountDto = {
  id: string;
  gameId: string;
  gameTitle: string;
  username: string;
  platform: string;
  region: string;
  activeUsersCount: number;
  isActive: boolean;
};

export type CreateAdminAccountDto = {
  gameId: string;
  username: string;
  password: string;
  sharedSecret: string;
  region?: string;
};

@Injectable()
export class AdminAccountsService {
  constructor(
    private readonly games: GamesRepository,
    private readonly gameAccounts: GameAccountsService,
    private readonly accounts: GameAccountsRepository,
  ) {}

  findAll(gameId?: string): Promise<AdminAccountDto[]> {
    return this.accounts.findAll(gameId).then(async (rows) => {
      const titles = await Promise.all(
        [...new Set(rows.map((row) => row.gameId))].map(async (id) => {
          const game = await this.games.findById(id);
          return [id, game?.title ?? 'Unknown'] as const;
        }),
      );
      const titleByGameId = Object.fromEntries(titles);

      return rows.map((row) => ({
        id: row.id,
        gameId: row.gameId,
        gameTitle: titleByGameId[row.gameId] ?? 'Unknown',
        username: row.username,
        platform: row.platform,
        region: row.region ?? 'global',
        activeUsersCount: row.activeUsersCount,
        isActive: row.isActive,
      }));
    });
  }

  async findOne(id: string): Promise<AdminAccountDto> {
    const account = await this.gameAccounts.findOne(id);
    const game = await this.games.findById(account.gameId);
    return {
      id: account.id,
      gameId: account.gameId,
      gameTitle: game?.title ?? 'Unknown',
      username: account.username,
      platform: account.platform,
      region: account.region ?? 'global',
      activeUsersCount: account.activeUsersCount,
      isActive: account.isActive,
    };
  }

  async create(dto: CreateAdminAccountDto): Promise<AdminAccountDto> {
    const game = await this.games.findById(dto.gameId);
    if (!game) {
      throw new NotFoundException(`No game found with id "${dto.gameId}"`);
    }
    if (game.platform !== 'steam') {
      throw new BadRequestException(
        'Pool accounts can only be created for Steam games in this phase',
      );
    }

    return this.gameAccounts.create({
      gameId: dto.gameId,
      platform: 'steam',
      username: dto.username,
      password: dto.password,
      sharedSecret: dto.sharedSecret,
      region: dto.region,
    }).then(async (account) => {
      const game = await this.games.findById(account.gameId);
      return {
        id: account.id,
        gameId: account.gameId,
        gameTitle: game?.title ?? 'Unknown',
        username: account.username,
        platform: account.platform,
        region: account.region ?? 'global',
        activeUsersCount: account.activeUsersCount,
        isActive: account.isActive,
      };
    });
  }

  async deactivate(id: string): Promise<AdminAccountDto> {
    const account = await this.gameAccounts.deactivate(id);
    const game = await this.games.findById(account.gameId);
    return {
      id: account.id,
      gameId: account.gameId,
      gameTitle: game?.title ?? 'Unknown',
      username: account.username,
      platform: account.platform,
      region: account.region ?? 'global',
      activeUsersCount: account.activeUsersCount,
      isActive: account.isActive,
    };
  }
}
