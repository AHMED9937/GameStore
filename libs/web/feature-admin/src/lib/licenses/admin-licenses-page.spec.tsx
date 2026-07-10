import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminLicensesPage } from './admin-licenses-page';
import { ADMIN_LICENSES_SETUP_MESSAGE } from './licenses.constants';

describe('AdminLicensesPage', () => {
  it('renders licenses heading and setup banner by default', () => {
    render(
      <AdminLicensesPage
        listState={{ status: 'setup', message: ADMIN_LICENSES_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Licenses' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_LICENSES_SETUP_MESSAGE,
    );
    expect(screen.getByTestId('admin-licenses-filters')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminLicensesPage listState={{ status: 'loading' }} />);
    expect(screen.getByTestId('admin-async-loading')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminLicensesPage listState={{ status: 'error', message: 'Forbidden' }} />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Forbidden');
  });

  it('renders empty table state', () => {
    render(<AdminLicensesPage listState={{ status: 'empty' }} />);
    expect(screen.getByText('No licenses issued yet.')).toBeTruthy();
  });

  it('renders licenses table with disabled revoke button', () => {
    render(
      <AdminLicensesPage
        listState={{
          status: 'success',
          data: [
            {
              id: 'lic-1',
              licenseKeyMasked: 'GS-****-ABCD',
              gameTitle: 'Demo Game',
              ownerEmail: 'player@example.com',
              status: 'assigned',
              source: 'admin',
              expiresAt: null,
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('admin-licenses-table')).toBeTruthy();
    expect(screen.getByText('GS-****-ABCD')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Edit license GS-****-ABCD' })
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('/admin/licenses/lic-1');
    expect(
      screen
        .getByRole('button', { name: 'Revoke license GS-****-ABCD' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });
});
