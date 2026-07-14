import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdminAccountEditPage } from './admin-account-edit-page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const baseAccount = {
  id: 'acc-1',
  gameId: 'game-1',
  gameTitle: 'Demo Game',
  username: 'pool_user',
  platform: 'steam',
  region: 'global',
  activeUsersCount: 2,
  maxActiveUsers: 50,
  isActive: true,
  lockedUntil: null as string | null,
  guardLockedByLicenseId: null as string | null,
  lastHealthCheck: '2026-06-01T12:00:00.000Z',
  createdAt: '2025-01-15T08:30:00.000Z',
  openSeats: 48,
  isClaimable: true,
  poolStatus: 'available' as const,
};

const siblingEligible = {
  id: 'acc-2',
  gameId: 'game-1',
  gameTitle: 'Demo Game',
  username: 'pool_other',
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

const siblingLocked = {
  ...siblingEligible,
  id: 'acc-locked',
  username: 'pool_locked',
  poolStatus: 'locked' as const,
  isClaimable: false,
  lockedUntil: '2099-01-01T00:00:00.000Z',
  openSeats: 50,
};

const getAdminAccount = vi.fn();
const getAdminAccounts = vi.fn();
const updateAdminAccount = vi.fn();
const deactivateAdminAccount = vi.fn();
const reactivateAdminAccount = vi.fn();
const deleteAdminAccount = vi.fn();
const clearAdminAccountGuardLock = vi.fn();
const unassignAdminAccount = vi.fn();

vi.mock('@gamestore/web/data-access', () => ({
  getAdminAccount: (...args: unknown[]) => getAdminAccount(...args),
  getAdminAccounts: (...args: unknown[]) => getAdminAccounts(...args),
  updateAdminAccount: (...args: unknown[]) => updateAdminAccount(...args),
  deactivateAdminAccount: (...args: unknown[]) => deactivateAdminAccount(...args),
  reactivateAdminAccount: (...args: unknown[]) => reactivateAdminAccount(...args),
  deleteAdminAccount: (...args: unknown[]) => deleteAdminAccount(...args),
  clearAdminAccountGuardLock: (...args: unknown[]) =>
    clearAdminAccountGuardLock(...args),
  unassignAdminAccount: (...args: unknown[]) => unassignAdminAccount(...args),
  isSetupResponse: () => false,
  apiErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'Request failed',
}));

describe('AdminAccountEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccount.mockResolvedValue(baseAccount);
    getAdminAccounts.mockResolvedValue([baseAccount, siblingEligible, siblingLocked]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders status panel, read-only username, and ordered action sections', async () => {
    render(<AdminAccountEditPage accountId="acc-1" />);

    expect(
      await screen.findByRole('heading', { name: 'Edit Steam account' }),
    ).toBeTruthy();
    expect(screen.getByTestId('admin-account-edit-status')).toBeTruthy();
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByDisplayValue('pool_user')).toBeTruthy();
    expect(
      (screen.getByDisplayValue('pool_user') as HTMLInputElement).readOnly,
    ).toBe(true);

    const unassignPanel = screen.getByTestId('admin-account-unassign-panel');
    const deleteSection = screen.getByTestId('admin-account-delete-section');
    const toolbar = screen.getByTestId('admin-account-edit-actions');
    expect(
      unassignPanel.compareDocumentPosition(deleteSection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      deleteSection.compareDocumentPosition(toolbar) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeTruthy();
  });

  it('shows destination select when occupied and posts targetAccountId', async () => {
    unassignAdminAccount.mockResolvedValue({
      ...baseAccount,
      gameId: null,
      gameTitle: null,
      activeUsersCount: 0,
      openSeats: 50,
    });

    render(<AdminAccountEditPage accountId="acc-1" />);

    expect(await screen.findByTestId('admin-account-unassign-target')).toBeTruthy();
    await waitFor(() => {
      expect(getAdminAccounts).toHaveBeenCalledWith({ gameId: 'game-1' });
    });

    const select = screen.getByTestId(
      'admin-account-unassign-target',
    ) as HTMLSelectElement;
    expect(select.value).toBe('acc-2');
    const lockedOption = Array.from(select.options).find(
      (option) => option.value === 'acc-locked',
    );
    expect(lockedOption?.disabled).toBe(true);

    fireEvent.click(screen.getByTestId('admin-account-unassign'));

    await waitFor(() => {
      expect(unassignAdminAccount).toHaveBeenCalledWith('acc-1', {
        targetAccountId: 'acc-2',
      });
    });
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Move 2 seats to pool_other'),
    );
    expect(await screen.findByText('Unassigned inventory')).toBeTruthy();
  });

  it('disables unassign when no eligible destination exists', async () => {
    getAdminAccounts.mockResolvedValue([baseAccount, siblingLocked]);

    render(<AdminAccountEditPage accountId="acc-1" />);

    await screen.findByTestId('admin-account-unassign-panel');
    await waitFor(() => {
      expect(
        screen.getByText(/Link another claimable account with enough open seats/),
      ).toBeTruthy();
    });
    expect(
      (screen.getByTestId('admin-account-unassign') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByTestId('admin-account-deactivate') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('deactivates occupied accounts with shared targetAccountId', async () => {
    deactivateAdminAccount.mockResolvedValue({
      ...baseAccount,
      gameId: null,
      gameTitle: null,
      activeUsersCount: 0,
      isActive: false,
      poolStatus: 'inactive',
      isClaimable: false,
    });

    render(<AdminAccountEditPage accountId="acc-1" />);

    await screen.findByTestId('admin-account-unassign-target');
    fireEvent.click(screen.getByTestId('admin-account-deactivate'));

    await waitFor(() => {
      expect(deactivateAdminAccount).toHaveBeenCalledWith('acc-1', {
        targetAccountId: 'acc-2',
      });
    });
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('unassign pool_user, then deactivate'),
    );
    expect(await screen.findByText('Unassigned inventory')).toBeTruthy();
  });

  it('deactivates empty assigned accounts without a target body', async () => {
    getAdminAccount.mockResolvedValue({
      ...baseAccount,
      activeUsersCount: 0,
      openSeats: 50,
    });
    deactivateAdminAccount.mockResolvedValue({
      ...baseAccount,
      gameId: null,
      gameTitle: null,
      activeUsersCount: 0,
      isActive: false,
      poolStatus: 'inactive',
    });

    render(<AdminAccountEditPage accountId="acc-1" />);

    await screen.findByTestId('admin-account-deactivate');
    fireEvent.click(screen.getByTestId('admin-account-deactivate'));

    await waitFor(() => {
      expect(deactivateAdminAccount).toHaveBeenCalledWith('acc-1');
      expect(deactivateAdminAccount.mock.calls[0]).toHaveLength(1);
    });
  });

  it('unassigns empty accounts without a target body', async () => {
    getAdminAccount.mockResolvedValue({
      ...baseAccount,
      activeUsersCount: 0,
      openSeats: 50,
    });
    unassignAdminAccount.mockResolvedValue({
      ...baseAccount,
      gameId: null,
      gameTitle: null,
      activeUsersCount: 0,
    });

    render(<AdminAccountEditPage accountId="acc-1" />);

    await screen.findByTestId('admin-account-unassign-panel');
    expect(screen.queryByTestId('admin-account-unassign-target')).toBeNull();
    expect(getAdminAccounts).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('admin-account-unassign'));

    await waitFor(() => {
      expect(unassignAdminAccount).toHaveBeenCalledWith('acc-1');
      expect(unassignAdminAccount.mock.calls[0]).toHaveLength(1);
    });
  });

  it('shows clear Steam Guard lock when account is locked', async () => {
    getAdminAccount.mockResolvedValue({
      ...baseAccount,
      activeUsersCount: 0,
      openSeats: 50,
      poolStatus: 'locked',
      isClaimable: false,
      lockedUntil: '2099-01-01T00:00:00.000Z',
      guardLockedByLicenseId: 'license-1',
    });
    clearAdminAccountGuardLock.mockResolvedValue({
      ...baseAccount,
      activeUsersCount: 0,
      poolStatus: 'available',
      lockedUntil: null,
      guardLockedByLicenseId: null,
    });

    render(<AdminAccountEditPage accountId="acc-1" />);

    expect(await screen.findByTestId('admin-account-clear-guard-lock')).toBeTruthy();
    fireEvent.click(screen.getByTestId('admin-account-clear-guard-lock'));

    await waitFor(() => {
      expect(clearAdminAccountGuardLock).toHaveBeenCalledWith('acc-1');
    });
  });
});
