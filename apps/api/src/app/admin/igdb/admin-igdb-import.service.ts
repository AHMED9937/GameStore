import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import {
  IgdbClient,
  IgdbClientError,
  IgdbConfig,
  importIgdbGame,
  type IgdbImportInput,
} from '@gamestore/api/igdb';

function mapIgdbClientError(error: unknown): never {
  if (error instanceof IgdbClientError) {
    if (error.kind === 'auth' || error.kind === 'upstream') {
      throw new ServiceUnavailableException(error.message);
    }
    throw new BadRequestException(error.message);
  }

  const message = error instanceof Error ? error.message : 'IGDB request failed';
  throw new BadRequestException(message);
}

@Injectable()
export class AdminIgdbImportService {
  private readonly client = new IgdbClient();

  constructor(private readonly prisma: PrismaService) {}

  async importGame(input: IgdbImportInput) {
    if (!IgdbConfig.isConfigured()) {
      return IgdbConfig.getSetupResponse('import');
    }

    try {
      const existing = await this.prisma.game.findUnique({
        where: { igdbId: input.igdbId },
      });
      const game = await importIgdbGame(this.prisma, this.client, input);
      return { game, updated: Boolean(existing) };
    } catch (error: unknown) {
      if (error instanceof IgdbClientError) {
        mapIgdbClientError(error);
      }
      const message = error instanceof Error ? error.message : 'IGDB import failed';
      throw new BadRequestException(message);
    }
  }

  async syncGame(gameId: string) {
    if (!IgdbConfig.isConfigured()) {
      return IgdbConfig.getSetupResponse('sync');
    }

    const existing = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!existing) {
      throw new NotFoundException(`No game found with id "${gameId}"`);
    }
    if (!existing.igdbId) {
      throw new BadRequestException('Game has no igdbId import from IGDB first');
    }

    try {
      const game = await importIgdbGame(this.prisma, this.client, {
        igdbId: existing.igdbId,
        priceBase: existing.priceBase.toNumber(),
        platform: existing.platform,
        slug: existing.slug,
      });
      return { game };
    } catch (error: unknown) {
      if (error instanceof IgdbClientError) {
        mapIgdbClientError(error);
      }
      const message = error instanceof Error ? error.message : 'IGDB sync failed';
      throw new BadRequestException(message);
    }
  }
}
