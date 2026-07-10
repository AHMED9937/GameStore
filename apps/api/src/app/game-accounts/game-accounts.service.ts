import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GameAccountsRepository } from '@gamestore/api/data-access';
import { SteamCryptoService } from '@gamestore/api/steam';

export type CreateGameAccountDto = {
  gameId?: string;
  platform: string;
  username: string;
  password?: string;
  passwordEncrypted?: string;
  sharedSecret: string;
  region?: string;
  maxActiveUsers?: number;
};

export type UpdateGameAccountDto = {
  username?: string;
  region?: string;
  password?: string;
  sharedSecret?: string;
  maxActiveUsers?: number;
};

@Injectable()
export class GameAccountsService {
  constructor(
    private readonly accounts: GameAccountsRepository,
    private readonly crypto: SteamCryptoService,
  ) {}

  findAll(gameId?: string) {
    return this.accounts.findAll(gameId ? { gameId } : undefined);
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
      ...(dto.maxActiveUsers !== undefined
        ? { maxActiveUsers: dto.maxActiveUsers }
        : {}),
      ...(dto.gameId ? { game: { connect: { id: dto.gameId } } } : {}),
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.accounts.deactivate(id);
  }

  async update(id: string, dto: UpdateGameAccountDto) {
    await this.findOne(id);

    const data: {
      username?: string;
      region?: string;
      passwordEncrypted?: string;
      sharedSecret?: string;
      maxActiveUsers?: number;
      lockedUntil?: null;
      guardLockedByLicenseId?: null;
    } = {};

    if (dto.username?.trim()) {
      data.username = dto.username.trim();
    }
    if (dto.region?.trim()) {
      data.region = dto.region.trim();
    }

    let credentialsRotated = false;
    if (dto.password?.trim()) {
      if (!this.crypto.isConfigured()) {
        throw new BadRequestException(
          'STEAM encryption is not configured; cannot rotate password',
        );
      }
      data.passwordEncrypted = this.crypto.encrypt(dto.password.trim());
      credentialsRotated = true;
    }
    if (dto.sharedSecret?.trim()) {
      data.sharedSecret = this.resolveSharedSecret(dto.sharedSecret);
      credentialsRotated = true;
    }
    if (dto.maxActiveUsers !== undefined) {
      if (!Number.isInteger(dto.maxActiveUsers) || dto.maxActiveUsers < 1) {
        throw new BadRequestException('maxActiveUsers must be a positive integer');
      }
      data.maxActiveUsers = dto.maxActiveUsers;
    }

    if (
      !data.username &&
      !data.region &&
      !data.passwordEncrypted &&
      !data.sharedSecret &&
      data.maxActiveUsers === undefined
    ) {
      throw new BadRequestException('At least one field must be provided');
    }

    if (credentialsRotated) {
      data.lockedUntil = null;
      data.guardLockedByLicenseId = null;
    }

    return this.accounts.update(id, data);
  }

  async reactivate(id: string) {
    const account = await this.findOne(id);
    if (account.isActive) {
      return account;
    }
    if (account.activeUsersCount >= account.maxActiveUsers) {
      throw new ConflictException(
        'Pool account has reached the active user cap and cannot be reactivated',
      );
    }
    return this.accounts.reactivate(id);
  }

  async remove(id: string) {
    const account = await this.findOne(id);
    if (account.activeUsersCount > 0) {
      throw new BadRequestException(
        'Cannot delete a pool account with active license assignments',
      );
    }

    const activatedLicenses = await this.accounts.countActivatedLicenses(id);
    if (activatedLicenses > 0) {
      throw new BadRequestException(
        'Cannot delete a pool account linked to activated licenses',
      );
    }

    await this.accounts.delete(id);
    return { id, deleted: true as const };
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
