import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminGameFormPage } from './admin-game-form-page';
import { ADMIN_GAMES_SETUP_MESSAGE } from './games.constants';

describe('AdminGameFormPage', () => {
  it('renders new game heading, setup banner, and disabled form', () => {
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
    expect(screen.getByTestId('admin-game-form-actions')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminGameFormPage formState={{ status: 'loading' }} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminGameFormPage formState={{ status: 'error', message: 'Server error' }} />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Server error');
  });
});
