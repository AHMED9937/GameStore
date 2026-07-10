import { formatPlatformLabel } from './format-platform-label';
import { truncateDescription } from './truncate-description';

export type IgdbSeoDefaultsInput = {
  title: string;
  platform: string;
  priceBase: number | string;
  summary?: string | null;
  coverImage?: string | null;
};

export type IgdbSeoDefaults = {
  metaTitle: string;
  metaDescription: string;
  ogImage: string | null;
};

function formatPrice(priceBase: number | string): string {
  const value = typeof priceBase === 'string' ? Number.parseFloat(priceBase) : priceBase;
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

/** Mirrors @gamestore/shared/seo buildDefaultGameSeoFields (kept local for api-igdb tsc build). */
export function buildIgdbSeoDefaults(input: IgdbSeoDefaultsInput): IgdbSeoDefaults {
  const platformLabel = formatPlatformLabel(input.platform);
  const metaTitle = `Buy ${input.title} — ${platformLabel} Activation`;

  const summary = input.summary?.trim() ?? '';
  const price = formatPrice(input.priceBase);
  const suffix = ` Instant delivery, offline play, activation guide included. From $${price}.`;
  const metaDescription = summary
    ? truncateDescription(`${summary}${suffix}`)
    : truncateDescription(
        `Get ${input.title} for ${platformLabel}.${suffix}`.trim(),
      );

  return {
    metaTitle,
    metaDescription,
    ogImage: input.coverImage?.trim() || null,
  };
}
