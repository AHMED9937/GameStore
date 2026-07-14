import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deactivateAdminAccount,
  getAdminAccounts,
} from '@gamestore/web/data-access';
import {
  applyDebouncedSearchFilter,
  changeSelectFilter,
} from '../testing/admin-list-filters.test-utils';
import { AdminAccountsPage } from './admin-accounts-page';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminAccounts: vi.fn(),
    deactivateAdminAccount: vi.fn(),
  };
});

const emptyAccount = {
  id: 'acc-1',
  gameId: 'game-1',
  gameTitle: 'Demo Game',
  username: 'pool_user_01',
  platform: 'steam',
  region: 'global',
  activeUsersCount: 0,
  maxActiveUsers: 50,
  isActive: true,
  lockedUntil: null,
  guardLockedByLicenseId: null,
  lastHealthCheck: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  openSeats: 50,
  isClaimable: true,
  poolStatus: 'available' as const,
};

const occupiedAccount = {
  ...emptyAccount,
  id: 'acc-busy',
  username: 'pool_busy',
  activeUsersCount: 3,
  openSeats: 47,
};

describe('AdminAccountsPage wired', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('requests API with account filters', async () => {
    vi.mocked(getAdminAccounts).mockResolvedValue([emptyAccount]);

    render(<AdminAccountsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-accounts-table')).toBeTruthy();
    });

    await applyDebouncedSearchFilter(
      'Filter accounts by username or game',
      'pool',
    );
    changeSelectFilter('Filter accounts by status', 'active');
    changeSelectFilter('Filter accounts by platform', 'steam');

    await waitFor(() => {
      expect(getAdminAccounts).toHaveBeenLastCalledWith({
        q: 'pool',
        status: 'active',
        platform: 'steam',
      });
    });
  });

  it('routes occupied deactivate to account edit instead of calling API', async () => {
    vi.mocked(getAdminAccounts).mockResolvedValue([occupiedAccount]);

    render(<AdminAccountsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Deactivate account pool_busy' }),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Deactivate account pool_busy' }),
    );

    expect(deactivateAdminAccount).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/admin/accounts/acc-busy');
    expect(
      screen.getByText(/Open account edit to move occupied seats/),
    ).toBeTruthy();
  });
});
