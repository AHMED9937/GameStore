import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminFeaturedGames } from '@gamestore/web/data-access';
import { applyDebouncedSearchFilter } from '../testing/admin-list-filters.test-utils';
import { AdminFeaturedGamesPage } from './admin-featured-games-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminFeaturedGames: vi.fn(),
  };
});

describe('AdminFeaturedGamesPage wired', () => {
  it('requests available games with search filter', async () => {
    vi.mocked(getAdminFeaturedGames).mockResolvedValue({
      featured: [],
      available: [
        {
          id: 'g1',
          title: 'Stellar Odyssey',
          slug: 'stellar-odyssey',
          platform: 'steam',
          priceBase: '19.99',
          coverImage: null,
          coverCardImage: null,
          featuredOrder: null,
          releaseDate: null,
        },
      ],
    });

    render(<AdminFeaturedGamesPage />);

    await waitFor(() => {
      expect(screen.getByText('Stellar Odyssey')).toBeTruthy();
    });

    await applyDebouncedSearchFilter(
      'Filter available featured games by title or slug',
      'stellar',
    );

    await waitFor(() => {
      expect(getAdminFeaturedGames).toHaveBeenLastCalledWith('stellar');
    });
  });
});
