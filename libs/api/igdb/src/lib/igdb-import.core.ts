import type { PrismaClient } from '@prisma/client';
import type { IgdbClient } from './igdb-client';
import type { IgdbImportInput, IgdbImportedGame } from './igdb.types';
import { resolveUniqueSlug, slugifyTitle } from './igdb-slug';

function parsePriceBase(value: number | string): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('priceBase must be a non-negative number');
  }
  return parsed;
}

export async function importIgdbGame(
  prisma: PrismaClient,
  client: IgdbClient,
  input: IgdbImportInput,
): Promise<IgdbImportedGame> {
  if (!input.igdbId || input.igdbId < 1) {
    throw new Error('igdbId is required');
  }
  if (!input.platform?.trim()) {
    throw new Error('platform is required');
  }

  const details = await client.getGameDetails(input.igdbId);
  if (!details) {
    throw new Error(`IGDB game ${input.igdbId} not found`);
  }

  const { screenshots, videos } = await client.getGameMedia(input.igdbId);

  const existing = await prisma.game.findUnique({ where: { igdbId: input.igdbId } });
  const slug = existing
    ? input.slug?.trim() || existing.slug
    : await resolveUniqueSlug(
        prisma,
        input.slug?.trim() || slugifyTitle(details.title),
        input.igdbId,
      );

  const priceBase = parsePriceBase(input.priceBase);
  const coverImage = details.coverUrl ?? '/og/default.png';
  const coverCardImage = details.coverCardUrl ?? details.coverUrl ?? '/og/default.png';
  const syncedAt = new Date();

  const game = await prisma.$transaction(async (tx) => {
    const gameData = {
      title: details.title,
      slug,
      description: details.summary,
      platform: input.platform.trim(),
      priceBase,
      coverImage,
      coverCardImage,
      igdbCoverUrl: details.coverSourceUrl,
      releaseDate: details.releaseDate,
      genres: details.genres,
      igdbSyncedAt: syncedAt,
      publishedAt: null as Date | null,
    };

    const saved = existing
      ? await tx.game.update({ where: { id: existing.id }, data: gameData })
      : await tx.game.create({
          data: {
            ...gameData,
            igdbId: input.igdbId,
          },
        });

    await tx.gameMedia.deleteMany({ where: { gameId: saved.id } });

    const mediaRows = [
      ...screenshots.map((shot, index) => ({
        gameId: saved.id,
        type: 'screenshot',
        url: shot.url,
        igdbId: shot.igdbId,
        sortOrder: index,
      })),
      ...videos.map((video, index) => ({
        gameId: saved.id,
        type: 'video',
        url: video.url,
        title: video.title,
        igdbId: video.igdbId,
        sortOrder: screenshots.length + index,
      })),
    ];

    if (mediaRows.length > 0) {
      await tx.gameMedia.createMany({ data: mediaRows });
    }

    return saved;
  });

  if (!game.igdbId) {
    throw new Error('Imported game is missing igdbId');
  }

  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    igdbId: game.igdbId,
    platform: game.platform,
    priceBase: game.priceBase.toString(),
    publishedAt: game.publishedAt?.toISOString() ?? null,
  };
}
