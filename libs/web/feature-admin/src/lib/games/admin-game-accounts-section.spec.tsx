import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdminGameAccountsSection } from './admin-game-accounts-section';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
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
  lockedUntil: null,
  guardLockedByLicenseId: null,
  lastHealthCheck: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  openSeats: 50,
  isClaimable: true,
  poolStatus: 'available' as const,
};

const secondLinked = {
  id: 'linked-2',
  gameId: 'game-1',
  gameTitle: 'Demo Game',
  username: 'linked-two',
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
  lockedUntil: null,
  guardLockedByLicenseId: null,
  lastHealthCheck: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  openSeats: 50,
  isClaimable: true,
  poolStatus: 'available' as const,
};

const getAdminAccounts = vi.fn();
const getAvailableAdminAccounts = vi.fn();
const assignAdminAccountToGame = vi.fn();
const setAdminGameNextAccount = vi.fn();

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminAccounts: (...args: unknown[]) => getAdminAccounts(...args),
    getAvailableAdminAccounts: (...args: unknown[]) =>
      getAvailableAdminAccounts(...args),
    assignAdminAccountToGame: (...args: unknown[]) =>
      assignAdminAccountToGame(...args),
    setAdminGameNextAccount: (...args: unknown[]) =>
      setAdminGameNextAccount(...args),
  };
});

describe('AdminGameAccountsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccounts.mockResolvedValue([linkedAccount, secondLinked]);
    getAvailableAdminAccounts.mockResolvedValue([availableAccount]);
    assignAdminAccountToGame.mockResolvedValue({
      ...availableAccount,
      gameId: 'game-1',
      gameTitle: 'Demo Game',
    });
    setAdminGameNextAccount.mockResolvedValue({
      id: 'game-1',
      nextAccountId: 'linked-2',
    });
  });

  it('does not render inline credential create fields', async () => {
    render(<AdminGameAccountsSection gameId="game-1" />);

    await waitFor(() => {
      expect(screen.getByText('linked-user')).toBeTruthy();
    });

    expect(screen.queryByPlaceholderText('pool-my-game')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add pool account' })).toBeNull();
    expect(screen.getByTestId('admin-game-account-search')).toBeTruthy();
    expect(
      screen.getByText(/Showing the 3 most recently added inventory accounts/),
    ).toBeTruthy();
    expect(getAvailableAdminAccounts).toHaveBeenCalledWith('');
  });

  it('shows claimable pool status badges and SOT copy', async () => {
    render(<AdminGameAccountsSection gameId="game-1" />);

    await waitFor(() => {
      expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/2 claimable/)).toBeTruthy();
    expect(
      screen.getByText(/Edit credentials, capacity, Steam Guard lock/),
    ).toBeTruthy();
  });

  it('keeps Link and Set as next; omits deactivate, reactivate, and unlink', async () => {
    render(
      <AdminGameAccountsSection
        gameId="game-1"
        nextAccountId="linked-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('linked-user')).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: 'Link account' })).toBeTruthy();
    expect(screen.getByTestId('admin-game-set-next-linked-2')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reactivate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Unlink' })).toBeNull();
    expect(
      screen.getByTestId('admin-game-edit-account-linked-1').getAttribute('href'),
    ).toBe('/admin/accounts/linked-1');
  });

  it('filters available accounts and links selection', async () => {
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

  it('sets next buyer account', async () => {
    const onAccountsChange = vi.fn();
    render(
      <AdminGameAccountsSection
        gameId="game-1"
        nextAccountId="linked-1"
        onAccountsChange={onAccountsChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('linked-two')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('admin-game-set-next-linked-2'));

    await waitFor(() => {
      expect(setAdminGameNextAccount).toHaveBeenCalledWith('game-1', 'linked-2');
      expect(onAccountsChange).toHaveBeenCalled();
    });
  });

  it('blocks set-next for locked accounts in the UI', async () => {
    getAdminAccounts.mockResolvedValue([
      {
        ...linkedAccount,
        poolStatus: 'locked',
        isClaimable: false,
        lockedUntil: '2099-01-01T00:00:00.000Z',
        openSeats: 50,
      },
      secondLinked,
    ]);

    render(
      <AdminGameAccountsSection gameId="game-1" nextAccountId="linked-2" />,
    );

    await waitFor(() => {
      expect(screen.getByText('Locked (Steam Guard)')).toBeTruthy();
    });

    expect(screen.queryByTestId('admin-game-set-next-linked-1')).toBeNull();
    expect(screen.getByTestId('admin-game-edit-account-linked-1')).toBeTruthy();
  });
});
