import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameDetailPage } from './game-detail-page';

const sampleGame = {
  id: 'game-1',
  slug: 'demo-game',
  title: 'Demo Game',
  description:
    'Explore distant worlds in this epic space adventure with rich lore and challenging combat.',
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

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();

  return {
    ...actual,
    ApiError: class ApiError extends Error {
      status: number;

      constructor(status: number) {
        super('API error');
        this.status = status;
      }
    },
    getGameBySlug: vi.fn(async () => sampleGame),
  };
});

describe('GameDetailPage', () => {
  it('renders server-side SEO excerpt under the title', async () => {
    const ui = await GameDetailPage({ slug: 'demo-game' });
    const { container } = render(ui);

    expect(screen.getByRole('heading', { level: 1, name: 'Demo Game' })).toBeTruthy();
    const excerpt = container.querySelector('header p');
    expect(excerpt?.textContent).toContain(
      'Explore distant worlds in this epic space adventure',
    );
  });
});
