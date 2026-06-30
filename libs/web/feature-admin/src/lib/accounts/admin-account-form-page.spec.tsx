import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminAccountFormPage } from './admin-account-form-page';
import { ADMIN_ACCOUNTS_SETUP_MESSAGE } from './accounts.constants';

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
