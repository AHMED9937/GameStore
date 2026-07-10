import type { Metadata } from 'next';
import { siteConfig } from '../site-config';
import { buildDefaultGameSeoFields } from './build-default-game-seo-fields';
import { formatPlatformLabel } from './format-platform-label';
import type { SeoGameInput } from './seo-game.types';
import { truncateDescription } from './truncate-description';
import { resolveAbsoluteUrl } from '../url/resolve-absolute-url';

function withSiteName(title: string): string {
  return `${title} | ${siteConfig.siteName}`;
}

function resolveGameTitle(game: SeoGameInput): string {
  const override = game.metaTitle?.trim();
  if (override) {
    return override;
  }

  const platformLabel = formatPlatformLabel(game.platform);
  return `Buy ${game.title} — ${platformLabel} Activation`;
}

function resolveGameDescription(game: SeoGameInput): string {
  const override = game.metaDescription?.trim();
  if (override) {
    return truncateDescription(override);
  }

  const description = game.description?.trim();
  if (description) {
    return truncateDescription(description);
  }

  return buildDefaultGameSeoFields({
    title: game.title,
    platform: game.platform,
    priceBase: game.priceBase,
    summary: null,
    coverImage: game.coverImage,
  }).metaDescription;
}

function resolveGameOgImage(game: SeoGameInput): string {
  const candidate =
    game.ogImage?.trim() ||
    game.coverImage?.trim() ||
    siteConfig.defaultOgImage;
  return resolveAbsoluteUrl(candidate);
}

export function buildGameMetadata(game: SeoGameInput): Metadata {
  const title = withSiteName(resolveGameTitle(game));
  const description = resolveGameDescription(game);
  const canonicalPath = `/games/${game.slug}`;
  const ogImage = resolveGameOgImage(game);
  const openGraphTitle = resolveGameTitle(game);

  return {
    title,
    description,
    alternates: {
      canonical: resolveAbsoluteUrl(canonicalPath),
    },
    openGraph: {
      title: openGraphTitle,
      description,
      url: resolveAbsoluteUrl(canonicalPath),
      siteName: siteConfig.siteName,
      images: [
        {
          url: ogImage,
          alt: `${game.title} cover`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
