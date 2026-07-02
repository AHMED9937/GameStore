import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminAccountFormPage } from './admin-account-form-page';
import { ADMIN_ACCOUNTS_SETUP_MESSAGE } from './accounts.constants';
import { EMPTY_ADMIN_ACCOUNT_FORM_VALUES } from './admin-accounts.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminGames: vi.fn().mockResolvedValue([]),
  };
});

describe('AdminAccountFormPage', () => {
  it('renders add account heading, setup banner, and disabled form', () => {
    render(
      <AdminAccountFormPage
        formState={{ status: 'setup', message: ADMIN_ACCOUNTS_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Add account' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_ACCOUNTS_SETUP_MESSAGE,
    );
    expect(screen.getByLabelText('Add pool account')).toBeTruthy();
    expect(screen.getByTestId('admin-account-form-actions')).toBeTruthy();
  });

  it('renders enabled form fields in controlled success mode', () => {
    render(
      <AdminAccountFormPage
        formState={{ status: 'success', data: EMPTY_ADMIN_ACCOUNT_FORM_VALUES }}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Steam game' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save account' }).hasAttribute('disabled')).toBe(
      false,
    );
  });

  it('renders loading spinner', () => {
    render(<AdminAccountFormPage formState={{ status: 'loading' }} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminAccountFormPage
        formState={{ status: 'error', message: 'Server error' }}
      />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Server error');
  });
});
