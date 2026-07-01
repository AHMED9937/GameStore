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

export type AdminLicenseListItemDto = {
  id: string;
  licenseKeyMasked: string;
  gameTitle: string;
  ownerEmail: string | null;
  status: string;
};

export type AdminLicenseDetailDto = {
  id: string;
  licenseKey: string;
  gameId: string;
  gameTitle: string;
  status: string;
  buyerEmail: string | null;
  ownerEmail: string | null;
  createdAt: string;
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
    }));
  }

  async findOne(id: string): Promise<AdminLicenseDetailDto> {
    const license = await this.licenses.findOne(id);

    return {
      id: license.id,
      licenseKey: license.licenseKey,
      gameId: license.gameId,
      gameTitle: license.game.title,
      status: license.status,
      buyerEmail: license.buyerEmail,
      ownerEmail: license.owner?.email ?? null,
      createdAt: license.createdAt.toISOString(),
    };
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
}
