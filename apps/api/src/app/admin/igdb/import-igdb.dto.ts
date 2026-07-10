import { BadRequestException } from '@nestjs/common';

const ALLOWED_PLATFORMS = new Set(['steam', 'epic', 'gog', 'origin', 'uplay', 'other']);

export type ParsedImportIgdbBody = {
  igdbId: number;
  priceBase: number;
  platform: string;
  slug?: string;
};

export function parseImportIgdbBody(body: {
  igdbId?: number | string;
  priceBase?: number | string;
  platform?: string;
  slug?: string;
}): ParsedImportIgdbBody {
  const igdbId =
    typeof body.igdbId === 'string'
      ? Number.parseInt(body.igdbId, 10)
      : body.igdbId;

  if (!igdbId || !Number.isInteger(igdbId) || igdbId < 1) {
    throw new BadRequestException('igdbId is required and must be a positive integer');
  }

  const priceBase =
    body.priceBase === undefined
      ? 9.99
      : typeof body.priceBase === 'string'
        ? Number.parseFloat(body.priceBase)
        : body.priceBase;

  if (!Number.isFinite(priceBase) || priceBase < 0) {
    throw new BadRequestException('priceBase must be a non-negative number');
  }

  const platform = (body.platform ?? 'steam').trim().toLowerCase();
  if (!ALLOWED_PLATFORMS.has(platform)) {
    throw new BadRequestException(
      `platform must be one of: ${[...ALLOWED_PLATFORMS].join(', ')}`,
    );
  }

  const slug = body.slug?.trim();
  if (slug !== undefined && slug !== '' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new BadRequestException(
      'slug must be lowercase letters, numbers, and hyphens only',
    );
  }

  return {
    igdbId,
    priceBase,
    platform,
    slug: slug || undefined,
  };
}
