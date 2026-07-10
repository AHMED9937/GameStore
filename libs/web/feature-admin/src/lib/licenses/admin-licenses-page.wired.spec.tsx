import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminLicenses } from '@gamestore/web/data-access';
import {
  applyDebouncedSearchFilter,
  changeSelectFilter,
} from '../testing/admin-list-filters.test-utils';
import { AdminLicensesPage } from './admin-licenses-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminLicenses: vi.fn(),
  };
});

const mockLicenses = [
  {
    id: 'lic-1',
    licenseKeyMasked: 'GS-****-1111',
    gameTitle: 'Demo Game',
    ownerEmail: 'owner@example.com',
    status: 'available',
    source: 'admin',
    expiresAt: null,
  },
];

describe('AdminLicensesPage wired', () => {
  it('requests API with debounced text filters and immediate select filters', async () => {
    vi.mocked(getAdminLicenses).mockResolvedValue(mockLicenses);

    render(<AdminLicensesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-licenses-table')).toBeTruthy();
    });

    await applyDebouncedSearchFilter('Filter licenses by game', 'Demo');
    changeSelectFilter('Filter licenses by source', 'admin');
    await applyDebouncedSearchFilter('Filter licenses by owner', 'owner@example.com');
    changeSelectFilter('Filter licenses by status', 'available');
    changeSelectFilter('Filter licenses by expiry', 'lifetime');

    await waitFor(() => {
      expect(getAdminLicenses).toHaveBeenLastCalledWith({
        game: 'Demo',
        source: 'admin',
        owner: 'owner@example.com',
        status: 'available',
        expires: 'lifetime',
      });
    });
  });

  it('shows filtered empty state when API returns no rows', async () => {
    vi.mocked(getAdminLicenses)
      .mockResolvedValueOnce(mockLicenses)
      .mockResolvedValueOnce([]);

    render(<AdminLicensesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-licenses-table')).toBeTruthy();
    });

    await applyDebouncedSearchFilter('Filter licenses by game', 'missing');

    await waitFor(() => {
      expect(screen.getByText('No licenses match the current filters.')).toBeTruthy();
    });
    expect(screen.queryByText('GS-****-1111')).toBeNull();
  });
});
