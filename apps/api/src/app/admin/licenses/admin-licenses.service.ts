import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GamesRepository,
  generateLicenseKey,
  maskLicenseKey,
} from '@gamestore/api/data-access';
import { Prisma } from '@prisma/client';
import { LicensesService } from '../../licenses/licenses.service';
import {
  normalizeBulkIds,
  runBulkIds,
  type BulkActionResult,
} from '../bulk-action.types';

export type AdminLicenseListItemDto = {
  id: string;
  licenseKeyMasked: string;
  gameTitle: string;
  ownerEmail: string | null;
  status: string;
  source: string;
  expiresAt: string | null;
};

export type AdminLicenseDetailDto = {
  id: string;
  licenseKey: string;
  gameId: string;
  gameTitle: string;
  status: string;
  source: string;
  subscriptionId: string | null;
  validFrom: string;
  expiresAt: string | null;
  buyerEmail: string | null;
  buyerCountry: string | null;
  ownerEmail: string | null;
  createdAt: string;
  activatedAt: string | null;
};

export type UpdateAdminLicenseDto = {
  buyerEmail?: string;
  buyerCountry?: string;
  expiresAt?: string | null;
};

export type AdminLicenseCreatedDto = {
  id: string;
  licenseKey: string;
  gameId: string;
  status: string;
  buyerEmail: string | null;
};

export type CreateAdminLicenseDto = {
  gameId: string;
  licenseKey?: string;
  buyerEmail?: string;
  buyerCountry?: string;
  quantity?: number;
};

export type GenerateAdminLicenseDto = {
  gameId: string;
  buyerEmail?: string;
  buyerCountry?: string;
};

@Injectable()
export class AdminLicensesService {
  constructor(
    private readonly licenses: LicensesService,
    private readonly games: GamesRepository,
  ) {}

  async findAll(): Promise<AdminLicenseListItemDto[]> {
    const rows = await this.licenses.findAll();
    return rows.map((row) => ({
      id: row.id,
      licenseKeyMasked: maskLicenseKey(row.licenseKey),
      gameTitle: row.game.title,
      ownerEmail: row.owner?.email ?? row.buyerEmail ?? null,
      status: row.status,
      source: row.source,
      expiresAt: row.expiresAt?.toISOString() ?? null,
    }));
  }

  async findOne(id: string): Promise<AdminLicenseDetailDto> {
    const license = await this.licenses.findOne(id);

    return this.toDetailDto(license);
  }

  async update(
    id: string,
    dto: UpdateAdminLicenseDto,
  ): Promise<AdminLicenseDetailDto> {
    const license = await this.licenses.update(id, dto);
    return this.toDetailDto(license);
  }

  async generateKey(
    dto: GenerateAdminLicenseDto,
  ): Promise<AdminLicenseCreatedDto> {
    await this.assertGameExists(dto.gameId);
    const licenseKey = generateLicenseKey();
    return this.createLicense({
      gameId: dto.gameId,
      licenseKey,
      buyerEmail: dto.buyerEmail,
      buyerCountry: dto.buyerCountry,
    });
  }

  async create(dto: CreateAdminLicenseDto): Promise<AdminLicenseCreatedDto[]> {
    await this.assertGameExists(dto.gameId);
    const quantity = Math.min(Math.max(dto.quantity ?? 1, 1), 25);
    const results: AdminLicenseCreatedDto[] = [];

    for (let index = 0; index < quantity; index += 1) {
      const licenseKey = dto.licenseKey?.trim() || generateLicenseKey();
      if (index > 0 && dto.licenseKey?.trim()) {
        throw new ConflictException(
          'Custom licenseKey can only be used when quantity is 1',
        );
      }

      results.push(
        await this.createLicense({
          gameId: dto.gameId,
          licenseKey,
          buyerEmail: dto.buyerEmail,
          buyerCountry: dto.buyerCountry,
        }),
      );
    }

    return results;
  }

  async revoke(id: string): Promise<AdminLicenseDetailDto> {
    await this.licenses.revoke(id);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    return this.licenses.remove(id);
  }

  async bulkRevoke(ids: string[]): Promise<BulkActionResult> {
    const normalized = normalizeBulkIds(ids);
    return runBulkIds(normalized, async (id) => {
      await this.revoke(id);
    });
  }

  async bulkDelete(ids: string[]): Promise<BulkActionResult> {
    const normalized = normalizeBulkIds(ids);
    return runBulkIds(normalized, async (id) => {
      await this.remove(id);
    });
  }

  private async createLicense(input: {
    gameId: string;
    licenseKey: string;
    buyerEmail?: string;
    buyerCountry?: string;
  }): Promise<AdminLicenseCreatedDto> {
    try {
      const license = await this.licenses.create({
        gameId: input.gameId,
        licenseKey: input.licenseKey,
        status: 'available',
        buyerEmail: input.buyerEmail,
        buyerCountry: input.buyerCountry,
      });

      return {
        id: license.id,
        licenseKey: license.licenseKey,
        gameId: license.gameId,
        status: license.status,
        buyerEmail: license.buyerEmail,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `License key "${input.licenseKey}" already exists`,
        );
      }
      throw error;
    }
  }

  private async assertGameExists(gameId: string) {
    const game = await this.games.findById(gameId);
    if (!game) {
      throw new NotFoundException(`No game found with id "${gameId}"`);
    }
  }

  private toDetailDto(license: {
    id: string;
    licenseKey: string;
    gameId: string;
    status: string;
    source: string;
    subscriptionId: string | null;
    validFrom: Date;
    expiresAt: Date | null;
    buyerEmail: string | null;
    buyerCountry: string | null;
    createdAt: Date;
    activatedAt: Date | null;
    game: { title: string };
    owner: { email: string } | null;
  }): AdminLicenseDetailDto {
    return {
      id: license.id,
      licenseKey: license.licenseKey,
      gameId: license.gameId,
      gameTitle: license.game.title,
      status: license.status,
      source: license.source,
      subscriptionId: license.subscriptionId,
      validFrom: license.validFrom.toISOString(),
      expiresAt: license.expiresAt?.toISOString() ?? null,
      buyerEmail: license.buyerEmail,
      buyerCountry: license.buyerCountry,
      ownerEmail: license.owner?.email ?? null,
      createdAt: license.createdAt.toISOString(),
      activatedAt: license.activatedAt?.toISOString() ?? null,
    };
  }
}
