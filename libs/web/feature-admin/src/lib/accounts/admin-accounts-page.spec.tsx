import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminAccountsPage } from './admin-accounts-page';
import { ADMIN_ACCOUNTS_SETUP_MESSAGE } from './accounts.constants';

describe('AdminAccountsPage', () => {
  it('renders accounts heading and setup banner by default', () => {
    render(
      <AdminAccountsPage
        listState={{ status: 'setup', message: ADMIN_ACCOUNTS_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Steam accounts' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_ACCOUNTS_SETUP_MESSAGE,
    );
    expect(screen.getByTestId('admin-accounts-filters')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminAccountsPage listState={{ status: 'loading' }} />);
    expect(screen.getByTestId('admin-async-loading')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminAccountsPage listState={{ status: 'error', message: 'Forbidden' }} />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Forbidden');
  });

  it('renders empty table state', () => {
    render(<AdminAccountsPage listState={{ status: 'empty' }} />);
    expect(screen.getByText('No pool accounts yet.')).toBeTruthy();
  });

  it('renders accounts table without password columns', () => {
    render(
      <AdminAccountsPage
        listState={{
          status: 'success',
          data: [
            {
              id: 'acc-1',
              gameTitle: 'Demo Game',
              username: 'pool_user_01',
              platform: 'Steam',
              region: 'global',
              activeUsersCount: 3,
              maxActiveUsers: 50,
              isActive: true,
              lockedUntil: null,
              openSeats: 47,
              isClaimable: true,
              poolStatus: 'available',
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('admin-accounts-table')).toBeTruthy();
    expect(screen.getByText('3 / 50')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Edit account pool_user_01' }),
    ).toBeTruthy();
    expect(screen.queryByText(/password/i)).toBeNull();
    expect(
      screen
        .getByRole('button', { name: 'Deactivate account pool_user_01' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });
});
