import { buildGameMetadata } from './build-game-metadata';
import type { SeoGameInput } from './seo-game.types';

const baseGame: SeoGameInput = {
  slug: 'starfield',
  title: 'Starfield',
  description: 'A vast space RPG with exploration and combat.',
  platform: 'steam',
  priceBase: '9.99',
  coverImage: '/covers/starfield.jpg',
};

describe('buildGameMetadata', () => {
  it('uses admin overrides when provided', () => {
    const metadata = buildGameMetadata({
      ...baseGame,
      metaTitle: 'Custom SEO Title',
      metaDescription: 'Custom SEO description for search.',
      ogImage: 'https://cdn.example.com/og.jpg',
    });

    expect(metadata.title).toContain('Custom SEO Title');
    expect(metadata.description).toBe('Custom SEO description for search.');
    expect(metadata.openGraph?.images?.[0]?.url).toBe('https://cdn.example.com/og.jpg');
  });

  it('falls back to template title and description', () => {
    const metadata = buildGameMetadata(baseGame);

    expect(metadata.title).toContain('Buy Starfield — Steam Activation');
    expect(metadata.description).toContain('space RPG');
    expect(metadata.alternates?.canonical).toContain('/games/starfield');
  });

  it('uses default description template when description is empty', () => {
    const metadata = buildGameMetadata({
      ...baseGame,
      description: null,
    });

    expect(metadata.description).toContain('Starfield');
    expect(metadata.description).toContain('$9.99');
  });
});
