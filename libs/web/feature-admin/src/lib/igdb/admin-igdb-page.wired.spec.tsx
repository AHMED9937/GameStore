import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { searchAdminIgdb } from '@gamestore/web/data-access';
import { AdminIgdbPage } from './admin-igdb-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    searchAdminIgdb: vi.fn(),
    importAdminIgdbGame: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('AdminIgdbPage wired', () => {
  it('shows setup banner from API response', async () => {
    vi.mocked(searchAdminIgdb).mockResolvedValue({
      status: 'setup',
      integration: 'igdb',
      message: 'IGDB search is not configured.',
    });

    render(<AdminIgdbPage />);
    fireEvent.change(screen.getByLabelText('Search IGDB'), {
      target: { value: 'halo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
        'IGDB search is not configured.',
      );
    });
  });

  it('shows error banner when API fails', async () => {
    const { ApiError } = await import('@gamestore/web/data-access');
    vi.mocked(searchAdminIgdb).mockRejectedValue(new ApiError(503, 'busy'));

    render(<AdminIgdbPage />);
    fireEvent.change(screen.getByLabelText('Search IGDB'), {
      target: { value: 'halo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByTestId('admin-error-banner')).toBeTruthy();
    });
    expect(screen.getByTestId('admin-error-retry')).toBeTruthy();
  });
});
