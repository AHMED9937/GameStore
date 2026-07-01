import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GameAccountsRepository } from '@gamestore/api/data-access';
import { SteamCryptoService } from '@gamestore/api/steam';

export type CreateGameAccountDto = {
  gameId: string;
  platform: string;
  username: string;
  password?: string;
  passwordEncrypted?: string;
  sharedSecret: string;
  region?: string;
};

@Injectable()
export class GameAccountsService {
  constructor(
    private readonly accounts: GameAccountsRepository,
    private readonly crypto: SteamCryptoService,
  ) {}

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
    const passwordEncrypted = this.resolvePasswordEncrypted(dto);
    const sharedSecret = this.resolveSharedSecret(dto.sharedSecret);

    return this.accounts.create({
      platform: dto.platform,
      username: dto.username,
      passwordEncrypted,
      sharedSecret,
      region: dto.region,
      game: { connect: { id: dto.gameId } },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.accounts.deactivate(id);
  }

  private resolvePasswordEncrypted(dto: CreateGameAccountDto): string {
    if (dto.password?.trim()) {
      if (!this.crypto.isConfigured()) {
        throw new BadRequestException(
          'STEAM encryption is not configured; use passwordEncrypted instead',
        );
      }
      return this.crypto.encrypt(dto.password.trim());
    }
    if (dto.passwordEncrypted?.trim()) {
      return dto.passwordEncrypted.trim();
    }
    throw new BadRequestException(
      'password or passwordEncrypted is required',
    );
  }

  private resolveSharedSecret(sharedSecret: string): string {
    const value = sharedSecret?.trim();
    if (!value) {
      throw new BadRequestException('sharedSecret is required');
    }
    if (this.crypto.isEncrypted(value)) {
      return value;
    }
    if (!this.crypto.isConfigured()) {
      return value;
    }
    return this.crypto.encrypt(value);
  }
}
