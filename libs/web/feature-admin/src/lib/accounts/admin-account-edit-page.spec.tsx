import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminAccountEditPage } from './admin-account-edit-page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@gamestore/web/data-access', () => ({
  getAdminAccount: vi.fn().mockResolvedValue({
    id: 'acc-1',
    gameId: 'game-1',
    gameTitle: 'Demo Game',
    username: 'pool_user',
    platform: 'steam',
    region: 'global',
    activeUsersCount: 2,
    maxActiveUsers: 50,
    isActive: true,
  }),
  updateAdminAccount: vi.fn(),
  deactivateAdminAccount: vi.fn(),
  reactivateAdminAccount: vi.fn(),
  deleteAdminAccount: vi.fn(),
  isSetupResponse: () => false,
  apiErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'Request failed',
}));

describe('AdminAccountEditPage', () => {
  it('renders account details and save actions', async () => {
    render(<AdminAccountEditPage accountId="acc-1" />);

    expect(await screen.findByRole('heading', { name: 'Edit account' })).toBeTruthy();
    expect(screen.getByTestId('admin-account-edit-status')).toBeTruthy();
    expect(screen.getByDisplayValue('pool_user')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeTruthy();
    expect(screen.getByTestId('admin-account-delete-section')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeTruthy();
  });
});
