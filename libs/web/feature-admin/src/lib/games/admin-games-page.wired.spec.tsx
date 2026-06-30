import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminGames } from '@gamestore/web/data-access';
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
      message: 'Admin games — wired from API',
    });

    render(<AdminGamesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
        'Admin games — wired from API',
      );
    });
  });

  it('shows error banner when API fails', async () => {
    const { ApiError } = await import('@gamestore/web/data-access');
    vi.mocked(getAdminGames).mockRejectedValue(new ApiError(403, 'Forbidden'));

    render(<AdminGamesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-error-banner').textContent).toBe(
        'Admin access required',
      );
    });
  });
});
