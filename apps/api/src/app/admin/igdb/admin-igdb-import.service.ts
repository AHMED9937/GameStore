import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import {
  IgdbClient,
  IgdbConfig,
  importIgdbGame,
  type IgdbImportInput,
} from '@gamestore/api/igdb';

@Injectable()
export class AdminIgdbImportService {
  private readonly client = new IgdbClient();

  constructor(private readonly prisma: PrismaService) {}

  async importGame(input: IgdbImportInput) {
    if (!IgdbConfig.isConfigured()) {
      return IgdbConfig.getSetupResponse('import');
    }

    try {
      const game = await importIgdbGame(this.prisma, this.client, input);
      return { game };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'IGDB import failed';
      throw new BadRequestException(message);
    }
  }
}
