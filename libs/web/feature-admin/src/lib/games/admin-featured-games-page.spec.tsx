import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  getAdminFeaturedGames,
  updateAdminFeaturedGames,
} from '@gamestore/web/data-access';
import { AdminFeaturedGamesPage } from './admin-featured-games-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminFeaturedGames: vi.fn(),
    updateAdminFeaturedGames: vi.fn(),
  };
});

const featuredGame = {
  id: 'g1',
  title: 'Alpha Game',
  slug: 'alpha-game',
  platform: 'steam',
  priceBase: '9.99',
  coverImage: '/a.png',
  coverCardImage: null,
  featuredOrder: 1,
  releaseDate: '2026-01-01',
};

const availableGame = {
  id: 'g2',
  title: 'Beta Game',
  slug: 'beta-game',
  platform: 'steam',
  priceBase: '14.99',
  coverImage: '/b.png',
  coverCardImage: null,
  featuredOrder: null,
  releaseDate: '2026-02-01',
};

describe('AdminFeaturedGamesPage', () => {
  it('adds an available game to featured slots', async () => {
    vi.mocked(getAdminFeaturedGames).mockResolvedValue({
      featured: [featuredGame],
      available: [availableGame],
    });

    render(<AdminFeaturedGamesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Game')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Beta Game')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save featured' })).toBeTruthy();
  });

  it('saves featured order through the admin API', async () => {
    vi.mocked(getAdminFeaturedGames).mockResolvedValue({
      featured: [featuredGame],
      available: [availableGame],
    });
    vi.mocked(updateAdminFeaturedGames).mockResolvedValue({
      featured: [featuredGame, { ...availableGame, featuredOrder: 2 }],
      available: [],
    });

    render(<AdminFeaturedGamesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Game')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save featured' }));

    await waitFor(() => {
      expect(updateAdminFeaturedGames).toHaveBeenCalledWith(['g1', 'g2']);
    });
  });
});
