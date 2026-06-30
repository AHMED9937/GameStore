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
    expect(screen.getByTestId('admin-accounts-game-filter')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminAccountsPage listState={{ status: 'loading' }} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
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
              isActive: true,
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('admin-accounts-table')).toBeTruthy();
    expect(screen.getByText('pool_user_01')).toBeTruthy();
    expect(screen.queryByText(/password/i)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Deactivate' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});
