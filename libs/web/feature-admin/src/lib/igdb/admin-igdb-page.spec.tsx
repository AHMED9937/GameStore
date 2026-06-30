import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminIgdbPage } from './admin-igdb-page';
import { ADMIN_IGDB_SETUP_MESSAGE } from './igdb.constants';

describe('AdminIgdbPage', () => {
  it('renders IGDB heading, search shell, and setup banner by default', () => {
    render(<AdminIgdbPage />);
    expect(screen.getByRole('heading', { name: 'IGDB import' })).toBeTruthy();
    expect(screen.getByTestId('admin-igdb-search')).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_IGDB_SETUP_MESSAGE,
    );
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
          data: [{ igdbId: 42, title: 'Halo', releaseDate: '2001-11-15' }],
        }}
      />,
    );
    expect(screen.getByTestId('admin-igdb-results-grid')).toBeTruthy();
    expect(screen.getByText('Halo')).toBeTruthy();
  });
});
