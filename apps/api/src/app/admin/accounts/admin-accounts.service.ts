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
  maxActiveUsers: number;
  isActive: boolean;
};

export type CreateAdminAccountDto = {
  gameId: string;
  username: string;
  password: string;
  sharedSecret: string;
  region?: string;
  maxActiveUsers?: number;
};

export type UpdateAdminAccountDto = {
  username?: string;
  region?: string;
  password?: string;
  sharedSecret?: string;
  maxActiveUsers?: number;
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

      return rows.map((row) =>
        this.mapAdminAccountDto(row, titleByGameId[row.gameId] ?? 'Unknown'),
      );
    });
  }

  async findOne(id: string): Promise<AdminAccountDto> {
    const account = await this.gameAccounts.findOne(id);
    const game = await this.games.findById(account.gameId);
    return this.mapAdminAccountDto(account, game?.title ?? 'Unknown');
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

    const account = await this.gameAccounts.create({
      gameId: dto.gameId,
      platform: 'steam',
      username: dto.username,
      password: dto.password,
      sharedSecret: dto.sharedSecret,
      region: dto.region,
      maxActiveUsers: dto.maxActiveUsers,
    });

    return this.mapAdminAccountDto(account, game.title);
  }

  async deactivate(id: string): Promise<AdminAccountDto> {
    const account = await this.gameAccounts.deactivate(id);
    const game = await this.games.findById(account.gameId);
    return this.mapAdminAccountDto(account, game?.title ?? 'Unknown');
  }

  async update(id: string, dto: UpdateAdminAccountDto): Promise<AdminAccountDto> {
    const existing = await this.gameAccounts.findOne(id);
    const game = await this.games.findById(existing.gameId);
    if (!game) {
      throw new NotFoundException(`No game found with id "${existing.gameId}"`);
    }
    if (game.platform !== 'steam') {
      throw new BadRequestException(
        'Pool accounts can only be updated for Steam games in this phase',
      );
    }

    const account = await this.gameAccounts.update(id, dto);
    return this.mapAdminAccountDto(account, game.title);
  }

  async reactivate(id: string): Promise<AdminAccountDto> {
    const account = await this.gameAccounts.reactivate(id);
    const game = await this.games.findById(account.gameId);
    return this.mapAdminAccountDto(account, game?.title ?? 'Unknown');
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.gameAccounts.findOne(id);
    return this.gameAccounts.remove(id);
  }

  private mapAdminAccountDto(
    account: {
      id: string;
      gameId: string;
      username: string;
      platform: string;
      region: string | null;
      activeUsersCount: number;
      maxActiveUsers: number;
      isActive: boolean;
    },
    gameTitle: string,
  ): AdminAccountDto {
    return {
      id: account.id,
      gameId: account.gameId,
      gameTitle,
      username: account.username,
      platform: account.platform,
      region: account.region ?? 'global',
      activeUsersCount: account.activeUsersCount,
      maxActiveUsers: account.maxActiveUsers,
      isActive: account.isActive,
    };
  }
}
