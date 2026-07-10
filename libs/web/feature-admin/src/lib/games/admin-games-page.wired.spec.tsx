import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminGames } from '@gamestore/web/data-access';
import {
  applyDebouncedSearchFilter,
  changeSelectFilter,
} from '../testing/admin-list-filters.test-utils';
import { AdminGamesPage } from './admin-games-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminGames: vi.fn(),
  };
});

describe('AdminGamesPage wired', () => {
  it('shows setup banner from API response', async () => {
    vi.mocked(getAdminGames).mockResolvedValue({
      status: 'setup',
      integration: 'admin-games',
      message: 'Admin games wired from API',
    });

    render(<AdminGamesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
        'Admin games wired from API',
      );
    });
  });

  it('shows error banner when API fails', async () => {
    const { ApiError } = await import('@gamestore/web/data-access');
    vi.mocked(getAdminGames).mockRejectedValue(new ApiError(403, 'Forbidden'));

    render(<AdminGamesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-error-banner').textContent).toContain(
        'Admin access required',
      );
    });
    expect(screen.getByTestId('admin-error-retry')).toBeTruthy();
  });

  it('recovers from transient API failure', async () => {
    const { ApiError } = await import('@gamestore/web/data-access');
    vi.mocked(getAdminGames)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          JSON.stringify({ error: 'API is starting or temporarily unreachable.' }),
        ),
      )
      .mockResolvedValueOnce([
        {
          id: 'g1',
          title: 'Demo Game',
          slug: 'demo-game',
          platform: 'PC',
          priceBase: '29.99',
          published: true,
          igdbId: 100001,
          featuredOrder: null,
          accountSummary: { total: 1, active: 1, hasActivePool: true },
          description: 'A long enough description for the wired recovery test.',
          coverImage: '/cover.png',
          genres: ['Adventure'],
          publishedAt: '2025-01-01T00:00:00.000Z',
          releaseDate: null,
          requirementsMin: null,
          requirementsRecommended: null,
          media: [],
        },
      ]);

    render(<AdminGamesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-row-checkbox-g1')).toBeTruthy();
    });
  });

  it('requests API with game filters', async () => {
    vi.mocked(getAdminGames).mockResolvedValue([
      {
        id: 'g1',
        title: 'Demo Game',
        slug: 'demo-game',
        platform: 'steam',
        priceBase: '29.99',
        published: true,
        soldOut: false,
        soldOutManual: false,
        featuredOrder: null,
        igdbId: 100001,
        accountSummary: { total: 1, active: 1, hasActivePool: true },
        description: 'A long enough description for the wired filter test.',
        coverImage: '/cover.png',
        genres: ['Adventure'],
        publishedAt: '2025-01-01T00:00:00.000Z',
        releaseDate: null,
        requirementsMin: null,
        requirementsRecommended: null,
        media: [],
      },
    ]);

    render(<AdminGamesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-games-table')).toBeTruthy();
    });

    await applyDebouncedSearchFilter(
      'Filter games by title or slug',
      'demo',
    );
    changeSelectFilter('Filter games by platform', 'steam');
    changeSelectFilter('Filter games by status', 'published');

    await waitFor(() => {
      expect(getAdminGames).toHaveBeenLastCalledWith({
        q: 'demo',
        platform: 'steam',
        status: 'published',
      });
    });
  });

  it('shows bulk toolbar when a row is selected', async () => {
    vi.mocked(getAdminGames).mockResolvedValue([
      {
        id: 'g1',
        title: 'Demo Game',
        slug: 'demo-game',
        platform: 'PC',
        priceBase: '29.99',
        published: true,
        igdbId: 100001,
        accountSummary: { total: 1, active: 1, hasActivePool: true },
        description: 'A long enough description for the wired bulk selection test.',
        coverImage: '/cover.png',
        genres: ['Adventure'],
        publishedAt: '2025-01-01T00:00:00.000Z',
        releaseDate: null,
        requirementsMin: null,
        requirementsRecommended: null,
        media: [],
      },
    ]);

    render(<AdminGamesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-row-checkbox-g1')).toBeTruthy();
    });

    expect(screen.queryByTestId('admin-bulk-toolbar')).toBeNull();
    fireEvent.click(screen.getByTestId('admin-row-checkbox-g1'));
    expect(screen.getByTestId('admin-bulk-toolbar')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeTruthy();
  });
});
