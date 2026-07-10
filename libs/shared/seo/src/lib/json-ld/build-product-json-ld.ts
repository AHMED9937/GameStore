import type { SeoGameInput } from '../metadata/seo-game.types';
import { resolveAbsoluteUrl } from '../url/resolve-absolute-url';
import { siteConfig } from '../site-config';
import { truncateDescription } from '../metadata/truncate-description';

export type ProductJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image?: string[];
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: 'USD';
    availability: string;
    url: string;
  };
};

export function buildProductJsonLd(game: SeoGameInput): ProductJsonLd {
  const image =
    game.ogImage?.trim() ||
    game.coverImage?.trim() ||
    siteConfig.defaultOgImage;
  const availability = game.soldOut
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.title,
    description: truncateDescription(game.description?.trim() || game.title),
    image: [resolveAbsoluteUrl(image)],
    offers: {
      '@type': 'Offer',
      price: game.priceBase,
      priceCurrency: 'USD',
      availability,
      url: resolveAbsoluteUrl(`/games/${game.slug}`),
    },
  };
}
