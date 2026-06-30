import { Injectable, NotFoundException } from '@nestjs/common';
import { GameAccountsRepository } from '@gamestore/api/data-access';

export type CreateGameAccountDto = {
  gameId: string;
  platform: string;
  username: string;
  passwordEncrypted: string;
  sharedSecret: string;
  region?: string;
};

@Injectable()
export class GameAccountsService {
  constructor(private readonly accounts: GameAccountsRepository) {}

  findAll(gameId?: string) {
    return this.accounts.findAll(gameId);
  }

  async findOne(id: string) {
    const account = await this.accounts.findById(id);
    if (!account) {
      throw new NotFoundException(`No game account found with id "${id}"`);
    }
    return account;
  }

  create(dto: CreateGameAccountDto) {
    return this.accounts.create({
      platform: dto.platform,
      username: dto.username,
      passwordEncrypted: dto.passwordEncrypted,
      sharedSecret: dto.sharedSecret,
      region: dto.region,
      game: { connect: { id: dto.gameId } },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.accounts.deactivate(id);
  }
}
