import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminIgdbPage } from './admin-igdb-page';
import { ADMIN_IGDB_SETUP_MESSAGE } from './igdb.constants';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@gamestore/web/data-access', async () => {
  const actual = await vi.importActual<typeof import('@gamestore/web/data-access')>(
    '@gamestore/web/data-access',
  );

  return {
    ...actual,
    searchAdminIgdb: vi.fn(),
    importAdminIgdbGame: vi.fn(),
  };
});

describe('AdminIgdbPage', () => {
  it('renders IGDB heading, search shell, and setup banner by default', () => {
    render(
      <AdminIgdbPage
        resultsState={{ status: 'setup', message: ADMIN_IGDB_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'IGDB import' })).toBeTruthy();
    expect(screen.getByTestId('admin-igdb-search')).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_IGDB_SETUP_MESSAGE,
    );
  });

  it('renders idle empty state before search', () => {
    render(<AdminIgdbPage />);
    expect(screen.getByTestId('admin-igdb-results-empty')).toBeTruthy();
    expect(screen.getByText('Search results will appear here.')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminIgdbPage resultsState={{ status: 'loading' }} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminIgdbPage resultsState={{ status: 'error', message: 'IGDB unavailable' }} />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('IGDB unavailable');
  });

  it('renders results grid on success', () => {
    render(
      <AdminIgdbPage
        resultsState={{
          status: 'success',
          data: [
            {
              igdbId: 42,
              title: 'Halo',
              releaseDate: '2001-11-15',
              coverUrl: 'https://images.igdb.com/cover.jpg',
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('admin-igdb-results-grid')).toBeTruthy();
    expect(screen.getByText('Halo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import' })).toBeTruthy();
  });

  it('submits search on button click', async () => {
    const { searchAdminIgdb } = await import('@gamestore/web/data-access');
    vi.mocked(searchAdminIgdb).mockResolvedValue([
      { igdbId: 42, title: 'Halo', releaseDate: '2001-11-15', coverUrl: null },
    ]);

    render(<AdminIgdbPage />);
    fireEvent.change(screen.getByLabelText('Search IGDB'), {
      target: { value: 'halo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(searchAdminIgdb).toHaveBeenCalledWith('halo');
    expect(await screen.findByText('Halo')).toBeTruthy();
  });
});
