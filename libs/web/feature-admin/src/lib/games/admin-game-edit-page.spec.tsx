import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM } from '@gamestore/shared/game-requirements';
import {
  getAdminGame,
  getAdminGameReadiness,
} from '@gamestore/web/data-access';
import { AdminGameEditPage } from './admin-game-edit-page';
import { ADMIN_GAMES_SETUP_MESSAGE } from './games.constants';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminGame: vi.fn(),
    getAdminGameReadiness: vi.fn(),
  };
});

describe('AdminGameEditPage', () => {
  it('renders edit heading, setup banner, form, and delete section', () => {
    render(
      <AdminGameEditPage
        gameId="game-123"
        formState={{ status: 'setup', message: ADMIN_GAMES_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Edit game' })).toBeTruthy();
    expect(screen.getByText(/Update catalog details for game game-123/)).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_GAMES_SETUP_MESSAGE,
    );
    expect(screen.getByTestId('admin-game-delete-section')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminGameEditPage gameId="game-123" formState={{ status: 'loading' }} />);
    expect(screen.getByTestId('admin-async-loading')).toBeTruthy();
  });

  it('renders populated form on success', () => {
    render(
      <AdminGameEditPage
        gameId="game-123"
        formState={{
          status: 'success',
          data: {
            title: 'Demo Game',
            slug: 'demo-game',
            platform: 'PC',
            description: 'A demo title',
            priceBase: '29.99',
            coverImage: '/cover.png',
            releaseDate: '2024-01-01',
            genresText: 'Adventure',
            requirementsMin: { ...EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM },
            requirementsRecommended: { ...EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM },
            metaTitle: '',
            metaDescription: '',
            ogImage: '',
            published: false,
            soldOutManual: false,
            discordAnnounceDescription: '',
          },
        }}
      />,
    );
    expect(screen.queryByTestId('admin-setup-banner')).toBeNull();
    expect(screen.getByDisplayValue('Demo Game')).toBeTruthy();
    expect(screen.getByDisplayValue('demo-game')).toBeTruthy();
  });

  it('shows Discord panel on Marketing tab', async () => {
    vi.mocked(getAdminGame).mockResolvedValue({
      id: 'game-123',
      title: 'Demo Game',
      slug: 'demo-game',
      platform: 'steam',
      description: 'A demo title',
      priceBase: '29.99',
      coverImage: '/cover.png',
      coverCardImage: null,
      releaseDate: '2024-01-01',
      genres: ['Adventure'],
      requirementsMin: null,
      requirementsRecommended: null,
      metaTitle: null,
      metaDescription: null,
      ogImage: null,
      published: true,
      publishedAt: '2024-01-01T00:00:00.000Z',
      soldOut: false,
      soldOutManual: false,
      featuredOrder: null,
      igdbId: null,
      igdbSyncedAt: null,
      igdbCoverUrl: null,
      media: [],
      accountSummary: { total: 1, active: 1, hasActivePool: true },
      discord: {
        configured: true,
        posted: true,
        messageId: 'msg-1',
        announceDescription: 'Discord launch copy',
      },
      discount: null,
      nextAccountId: null,
    } as never);
    vi.mocked(getAdminGameReadiness).mockResolvedValue({
      ready: true,
      canPublish: true,
      checks: [],
    });

    render(<AdminGameEditPage gameId="game-123" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Demo Game')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Marketing' }));

    await waitFor(() => {
      expect(screen.getByTestId('admin-game-marketing-section')).toBeTruthy();
      expect(screen.getByTestId('admin-game-discord-panel')).toBeTruthy();
    });
    expect(screen.getByDisplayValue('Discord launch copy')).toBeTruthy();
  });
});
