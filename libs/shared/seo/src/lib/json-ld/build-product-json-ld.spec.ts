import { buildProductJsonLd } from './build-product-json-ld';
import type { SeoGameInput } from '../metadata/seo-game.types';

const baseGame: SeoGameInput = {
  slug: 'demo-game-1',
  title: 'Demo Game',
  description: 'A demo game for testing.',
  platform: 'steam',
  priceBase: '19.99',
  coverImage: '/covers/demo.jpg',
};

describe('buildProductJsonLd', () => {
  it('builds in-stock product schema', () => {
    const jsonLd = buildProductJsonLd(baseGame);

    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.name).toBe('Demo Game');
    expect(jsonLd.offers.price).toBe('19.99');
    expect(jsonLd.offers.availability).toBe('https://schema.org/InStock');
    expect(jsonLd.offers.url).toContain('/games/demo-game-1');
  });

  it('marks sold out games as out of stock', () => {
    const jsonLd = buildProductJsonLd({ ...baseGame, soldOut: true });
    expect(jsonLd.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('uses priceOffer for discounted games', () => {
    const jsonLd = buildProductJsonLd({
      ...baseGame,
      priceOffer: '14.99',
    });
    expect(jsonLd.offers.price).toBe('14.99');
  });
});
