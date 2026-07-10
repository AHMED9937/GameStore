import { describe, expect, it } from 'vitest';
import { buildDefaultGameSeoFields } from '@gamestore/shared/seo';
import { buildIgdbSeoDefaults } from './igdb-seo-defaults';

describe('buildIgdbSeoDefaults', () => {
  it('matches shared-seo buildDefaultGameSeoFields output', () => {
    const input = {
      title: 'Halo',
      platform: 'steam',
      priceBase: 9.99,
      summary: 'Classic shooter.',
      coverImage: 'https://images.igdb.com/cover.jpg',
    };

    expect(buildIgdbSeoDefaults(input)).toEqual(buildDefaultGameSeoFields(input));
  });
});
