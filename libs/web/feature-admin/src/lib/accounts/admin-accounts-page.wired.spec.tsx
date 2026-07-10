import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminAccounts } from '@gamestore/web/data-access';
import {
  applyDebouncedSearchFilter,
  changeSelectFilter,
} from '../testing/admin-list-filters.test-utils';
import { AdminAccountsPage } from './admin-accounts-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminAccounts: vi.fn(),
  };
});

const mockAccounts = [
  {
    id: 'acc-1',
    gameId: 'game-1',
    gameTitle: 'Demo Game',
    username: 'pool_user_01',
    platform: 'steam',
    region: 'global',
    activeUsersCount: 0,
    maxActiveUsers: 50,
    isActive: true,
  },
];

describe('AdminAccountsPage wired', () => {
  it('requests API with account filters', async () => {
    vi.mocked(getAdminAccounts).mockResolvedValue(mockAccounts);

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
});
