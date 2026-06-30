import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminLicenseFormPage } from './admin-license-form-page';
import { ADMIN_LICENSES_SETUP_MESSAGE } from './licenses.constants';

describe('AdminLicenseFormPage', () => {
  it('renders issue license heading, setup banner, and disabled form', () => {
    render(
      <AdminLicenseFormPage
        formState={{ status: 'setup', message: ADMIN_LICENSES_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Issue license' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_LICENSES_SETUP_MESSAGE,
    );
    expect(screen.getByLabelText('Issue license')).toBeTruthy();
    expect(screen.getByTestId('admin-license-form-actions')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminLicenseFormPage formState={{ status: 'loading' }} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminLicenseFormPage
        formState={{ status: 'error', message: 'Server error' }}
      />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Server error');
  });
});
