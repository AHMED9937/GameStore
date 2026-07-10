import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminGameFormPage } from './admin-game-form-page';
import { ADMIN_GAMES_SETUP_MESSAGE } from './games.constants';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('AdminGameFormPage', () => {
  it('renders new game heading, setup banner, and tabbed form shell', () => {
    render(
      <AdminGameFormPage
        formState={{ status: 'setup', message: ADMIN_GAMES_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'New game' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_GAMES_SETUP_MESSAGE,
    );
    expect(screen.getByLabelText('Game details')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Storefront' })).toBeTruthy();
    expect(screen.getByTestId('admin-game-form-actions')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminGameFormPage formState={{ status: 'loading' }} />);
    expect(screen.getByTestId('admin-async-loading')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminGameFormPage formState={{ status: 'error', message: 'Server error' }} />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Server error');
  });
});
