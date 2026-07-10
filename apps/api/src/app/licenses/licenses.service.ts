import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { AuthUser } from '@gamestore/api/auth';
import { assertOwnedResourceAccess } from '@gamestore/api/auth';
import {
  GameAccountsRepository,
  LicensesRepository,
  defaultLicenseExpiresAt,
  resolveLicenseExpiresAt,
} from '@gamestore/api/data-access';
import { SteamCryptoService } from '@gamestore/api/steam';
import { EntitlementCleanupService } from '../entitlements/entitlement-cleanup.service';

export type LicenseValidation = {
  licenseKey: string;
  status: string;
  game: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    coverCardImage: string | null;
  };
};

export type LicenseActivation = {
  licenseKey: string;
  status: 'activated';
  game: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    coverCardImage: string | null;
  };
  account: { username: string; password: string };
};

export type CreateLicenseDto = {
  licenseKey: string;
  gameId: string;
  status?: string;
  buyerEmail?: string;
  buyerCountry?: string;
  ownerId?: string;
};

export type UpdateLicenseDto = {
  buyerEmail?: string;
  buyerCountry?: string;
  expiresAt?: string | null;
};

export type UserLicenseSummary = {
  id: string;
  licenseKey: string;
  status: string;
  source: string;
  validFrom: string;
  expiresAt: string;
  game: { id: string; title: string; slug: string };
};

export type LicenseListFilters = {
  game?: string;
  source?: string;
  owner?: string;
  status?: string;
  expires?: 'lifetime' | 'expiring' | 'expired';
};

@Injectable()
export class LicensesService {
  constructor(
    private readonly licenses: LicensesRepository,
    private readonly accounts: GameAccountsRepository,
    private readonly crypto: SteamCryptoService,
    private readonly entitlementCleanup: EntitlementCleanupService,
  ) {}

  async validate(
    licenseKey: string,
    user?: AuthUser,
  ): Promise<LicenseValidation> {
    const key = licenseKey?.trim();
    if (!key) {
      throw new BadRequestException('licenseKey is required');
    }

    const license = await this.licenses.findByKey(key);
    if (!license) {
      throw new NotFoundException('License not found');
    }
    if (license.status === 'revoked') {
      throw new ForbiddenException('License has been revoked');
    }
    this.assertNotExpired(license.expiresAt, license.validFrom);

    assertOwnedResourceAccess(
      user,
      license.ownerId,
      license.ownerId && !user
        ? 'Sign in to access this license'
        : 'You do not own this license',
    );

    return {
      licenseKey: license.licenseKey,
      status: license.status,
      game: license.game,
    };
  }

  async activate(
    licenseKey: string,
    user: AuthUser,
  ): Promise<LicenseActivation> {
    const key = licenseKey?.trim();
    if (!key) {
      throw new BadRequestException('licenseKey is required');
    }

    if (!this.crypto.isConfigured()) {
      throw new ServiceUnavailableException('STEAM encryption is not configured');
    }

    const license = await this.licenses.findByKeyForActivation(key);
    if (!license) {
      throw new NotFoundException('License not found');
    }
    if (license.status === 'revoked') {
      throw new ForbiddenException('License has been revoked');
    }
    this.assertNotExpired(license.expiresAt, license.validFrom);

    if (license.status === 'activated') {
      this.assertActivateOwnership(license.ownerId, user);
      if (!license.account) {
        throw new ConflictException('License is activated but has no account');
      }
      return this.toActivationResponse(license, license.account);
    }

    if (license.status !== 'available') {
      throw new ConflictException('License cannot be activated');
    }

    this.assertActivateOwnership(license.ownerId, user);

    const poolAccount = await this.accounts.findAvailableForGame(license.gameId);
    if (!poolAccount) {
      throw new ServiceUnavailableException(
        'No pool account available for this game',
      );
    }

    const ownerId = license.ownerId ?? user.id;
    const activated = await this.licenses.activateLicense({
      licenseId: license.id,
      accountId: poolAccount.id,
      ownerId,
    });

    if (!activated.account) {
      throw new ServiceUnavailableException('Failed to assign pool account');
    }

    return this.toActivationResponse(activated, activated.account);
  }

  async findMine(user: AuthUser): Promise<UserLicenseSummary[]> {
    const rows = await this.licenses.findByOwnerId(user.id);

    return rows.map((row) => ({
      id: row.id,
      licenseKey: row.licenseKey,
      status: row.status,
      source: row.source,
      validFrom: row.validFrom.toISOString(),
      expiresAt: resolveLicenseExpiresAt(
        row.expiresAt,
        row.validFrom,
      ).toISOString(),
      game: row.game,
    }));
  }

  findAll(Filters?: LicenseListFilters) {
    return this.licenses.findAll(Filters);
  }

  async findOne(id: string) {
    const license = await this.licenses.findById(id);
    if (!license) {
      throw new NotFoundException(`No license found with id "${id}"`);
    }
    return license;
  }

  create(dto: CreateLicenseDto) {
    const validFrom = new Date();
    return this.licenses.create({
      licenseKey: dto.licenseKey,
      status: dto.status,
      buyerEmail: dto.buyerEmail,
      buyerCountry: dto.buyerCountry,
      validFrom,
      expiresAt: defaultLicenseExpiresAt(validFrom),
      game: { connect: { id: dto.gameId } },
      ...(dto.ownerId ? { owner: { connect: { id: dto.ownerId } } } : {}),
    });
  }

  async revoke(id: string) {
    await this.findOne(id);
    return this.entitlementCleanup.revokeLicenseWithCleanup(id);
  }

  async update(id: string, dto: UpdateLicenseDto) {
    const license = await this.findOne(id);
    if (license.status !== 'available') {
      throw new BadRequestException(
        'Only available licenses can be updated',
      );
    }

    const buyerEmail =
      dto.buyerEmail === undefined
        ? undefined
        : dto.buyerEmail.trim() || null;
    const buyerCountry =
      dto.buyerCountry === undefined
        ? undefined
        : dto.buyerCountry.trim().toUpperCase() || null;
    const expiresAt =
      dto.expiresAt === undefined
        ? undefined
        : dto.expiresAt === null || dto.expiresAt.trim() === ''
          ? defaultLicenseExpiresAt(license.validFrom)
          : new Date(dto.expiresAt);

    if (expiresAt instanceof Date && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('expiresAt must be a valid ISO date');
    }

    return this.licenses.update(id, {
      ...(buyerEmail !== undefined ? { buyerEmail } : {}),
      ...(buyerCountry !== undefined ? { buyerCountry } : {}),
      ...(expiresAt !== undefined ? { expiresAt } : {}),
    });
  }

  async remove(id: string) {
    const license = await this.findOne(id);
    if (license.status === 'activated') {
      throw new BadRequestException(
        'Cannot delete an activated license',
      );
    }

    if (license.accountId) {
      await this.entitlementCleanup.releaseLicenseFromPool(id);
    }

    await this.licenses.delete(id);
    return { id, deleted: true as const };
  }

  private assertNotExpired(
    expiresAt: Date | null | undefined,
    validFrom: Date,
  ): void {
    const effectiveExpiry = resolveLicenseExpiresAt(expiresAt, validFrom);
    if (effectiveExpiry.getTime() <= Date.now()) {
      throw new ForbiddenException('License has expired');
    }
  }

  private assertActivateOwnership(
    ownerId: string | null | undefined,
    user: AuthUser,
  ) {
    if (ownerId && ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You do not own this license');
    }
  }

  private toActivationResponse(
    license: {
      licenseKey: string;
      game: LicenseActivation['game'];
    },
    account: { username: string; passwordEncrypted: string },
  ): LicenseActivation {
    return {
      licenseKey: license.licenseKey,
      status: 'activated',
      game: license.game,
      account: {
        username: account.username,
        password: this.decryptPassword(account.passwordEncrypted),
      },
    };
  }

  private decryptPassword(stored: string): string {
    if (this.crypto.isEncrypted(stored)) {
      return this.crypto.decrypt(stored);
    }
    return stored;
  }
}
