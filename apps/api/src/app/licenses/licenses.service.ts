import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '@gamestore/api/auth';
import { assertOwnedResourceAccess } from '@gamestore/api/auth';
import { LicensesRepository } from '@gamestore/api/data-access';

export type LicenseValidation = {
  licenseKey: string;
  status: string;
  game: { id: string; title: string; slug: string };
};

export type CreateLicenseDto = {
  licenseKey: string;
  gameId: string;
  status?: string;
  buyerEmail?: string;
  buyerCountry?: string;
  ownerId?: string;
};

export type UserLicenseSummary = {
  id: string;
  licenseKey: string;
  status: string;
  game: { id: string; title: string; slug: string };
};

@Injectable()
export class LicensesService {
  constructor(private readonly licenses: LicensesRepository) {}

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

  findMine(user: AuthUser): Promise<UserLicenseSummary[]> {
    return this.licenses.findByOwnerId(user.id);
  }

  findAll() {
    return this.licenses.findAll();
  }

  async findOne(id: string) {
    const license = await this.licenses.findById(id);
    if (!license) {
      throw new NotFoundException(`No license found with id "${id}"`);
    }
    return license;
  }

  create(dto: CreateLicenseDto) {
    return this.licenses.create({
      licenseKey: dto.licenseKey,
      status: dto.status,
      buyerEmail: dto.buyerEmail,
      buyerCountry: dto.buyerCountry,
      game: { connect: { id: dto.gameId } },
      ...(dto.ownerId ? { owner: { connect: { id: dto.ownerId } } } : {}),
    });
  }

  async revoke(id: string) {
    await this.findOne(id);
    return this.licenses.revoke(id);
  }
}
