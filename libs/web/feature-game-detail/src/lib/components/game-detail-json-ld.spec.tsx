import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GameDetail } from '@gamestore/web/data-access';
import { GameDetailJsonLd } from './game-detail-json-ld';

const sampleGame: GameDetail = {
  id: 'game-1',
  slug: 'demo-game',
  title: 'Demo Game',
  description: 'A long description for structured data.',
  platform: 'steam',
  priceBase: '19.99',
  coverImage: '/cover.png',
  soldOut: false,
  metaTitle: null,
  metaDescription: null,
  ogImage: null,
  genres: ['Adventure'],
  releaseDate: '2024-01-01',
  media: [],
  requirementsMin: null,
  requirementsRecommended: null,
};

describe('GameDetailJsonLd', () => {
  it('renders Product JSON-LD script tag', () => {
    const { container } = render(<GameDetailJsonLd game={sampleGame} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeTruthy();
    expect(script?.textContent).toContain('"@type":"Product"');
    expect(script?.textContent).toContain('"name":"Demo Game"');
  });
});
