import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdminGameAccountsSection } from './admin-game-accounts-section';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const linkedAccount = {
  id: 'linked-1',
  gameId: 'game-1',
  gameTitle: 'Demo Game',
  username: 'linked-user',
  platform: 'steam',
  region: 'global',
  activeUsersCount: 0,
  maxActiveUsers: 50,
  isActive: true,
};

const availableAccount = {
  id: 'avail-1',
  gameId: null,
  gameTitle: null,
  username: 'pool-alpha',
  platform: 'steam',
  region: 'global',
  activeUsersCount: 0,
  maxActiveUsers: 50,
  isActive: true,
};

const getAdminAccounts = vi.fn();
const getAvailableAdminAccounts = vi.fn();
const assignAdminAccountToGame = vi.fn();
const deactivateAdminAccount = vi.fn();
const unassignAdminAccount = vi.fn();

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminAccounts: (...args: unknown[]) => getAdminAccounts(...args),
    getAvailableAdminAccounts: (...args: unknown[]) =>
      getAvailableAdminAccounts(...args),
    assignAdminAccountToGame: (...args: unknown[]) =>
      assignAdminAccountToGame(...args),
    deactivateAdminAccount: (...args: unknown[]) => deactivateAdminAccount(...args),
    unassignAdminAccount: (...args: unknown[]) => unassignAdminAccount(...args),
  };
});

describe('AdminGameAccountsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccounts.mockResolvedValue([linkedAccount]);
    getAvailableAdminAccounts.mockResolvedValue([availableAccount]);
    assignAdminAccountToGame.mockResolvedValue({
      ...availableAccount,
      gameId: 'game-1',
      gameTitle: 'Demo Game',
    });
    deactivateAdminAccount.mockResolvedValue({ ...linkedAccount, isActive: false });
    unassignAdminAccount.mockResolvedValue({ ...availableAccount });
  });

  it('does not render inline credential create fields', async () => {
    render(<AdminGameAccountsSection gameId="game-1" />);

    await waitFor(() => {
      expect(screen.getByText('linked-user')).toBeTruthy();
    });

    expect(screen.queryByPlaceholderText('pool-my-game')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add pool account' })).toBeNull();
    expect(screen.getByTestId('admin-game-account-search')).toBeTruthy();
  });

  it('Filters available accounts and links selection', async () => {
    render(<AdminGameAccountsSection gameId="game-1" onAccountsChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('pool-alpha')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('admin-game-account-search'), {
      target: { value: 'alpha' },
    });

    await waitFor(() => {
      expect(getAvailableAdminAccounts).toHaveBeenCalledWith('alpha');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Link account' }));

    await waitFor(() => {
      expect(assignAdminAccountToGame).toHaveBeenCalledWith('avail-1', 'game-1');
    });
  });
});
