import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminGameEditPage } from './admin-game-edit-page';
import { ADMIN_GAMES_SETUP_MESSAGE } from './games.constants';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

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
    expect(screen.getByText('Loading…')).toBeTruthy();
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
            requirementsMin: '',
            requirementsRecommended: '',
            published: false,
          },
        }}
      />,
    );
    expect(screen.queryByTestId('admin-setup-banner')).toBeNull();
    expect(screen.getByDisplayValue('Demo Game')).toBeTruthy();
    expect(screen.getByDisplayValue('demo-game')).toBeTruthy();
  });
});
