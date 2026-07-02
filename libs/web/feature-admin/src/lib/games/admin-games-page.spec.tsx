import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminGamesPage } from './admin-games-page';
import { ADMIN_GAMES_SETUP_MESSAGE } from './games.constants';

describe('AdminGamesPage', () => {
  it('renders games heading and setup banner by default', () => {
    render(
      <AdminGamesPage
        listState={{ status: 'setup', message: ADMIN_GAMES_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Games' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_GAMES_SETUP_MESSAGE,
    );
    expect(screen.getByTestId('admin-games-toolbar')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminGamesPage listState={{ status: 'loading' }} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminGamesPage listState={{ status: 'error', message: 'Forbidden' }} />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Forbidden');
  });

  it('renders empty table state', () => {
    render(<AdminGamesPage listState={{ status: 'empty' }} />);
    expect(screen.getByText('No games in catalog yet.')).toBeTruthy();
  });

  it('renders games table on success', () => {
    render(
      <AdminGamesPage
        listState={{
          status: 'success',
          data: [
            {
              id: 'g1',
              title: 'Demo Game',
              slug: 'demo-game',
              platform: 'PC',
              priceBase: '29.99',
              published: true,
              igdbId: 100001,
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('admin-games-table')).toBeTruthy();
    expect(screen.getByText('Demo Game')).toBeTruthy();
  });
});
