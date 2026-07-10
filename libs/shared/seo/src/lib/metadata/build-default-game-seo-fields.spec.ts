import { buildDefaultGameSeoFields } from './build-default-game-seo-fields';

describe('buildDefaultGameSeoFields', () => {
  it('builds title and description from igdb summary and price', () => {
    const result = buildDefaultGameSeoFields({
      title: 'Starfield',
      platform: 'steam',
      priceBase: '9.99',
      summary: 'Explore the stars in this RPG adventure.',
      coverImage: '/covers/starfield.jpg',
    });

    expect(result.metaTitle).toBe('Buy Starfield — Steam Activation');
    expect(result.metaDescription).toContain('Explore the stars');
    expect(result.metaDescription).toContain('$9.99');
    expect(result.ogImage).toBe('/covers/starfield.jpg');
  });

  it('falls back when summary is missing', () => {
    const result = buildDefaultGameSeoFields({
      title: 'Mystery Game',
      platform: 'epic',
      priceBase: 12,
      summary: null,
      coverImage: null,
    });

    expect(result.metaDescription).toContain('Mystery Game');
    expect(result.metaDescription).toContain('Epic Games');
    expect(result.ogImage).toBeNull();
  });
});
