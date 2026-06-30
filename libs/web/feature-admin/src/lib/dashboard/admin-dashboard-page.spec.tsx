import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ADMIN_DASHBOARD_SETUP_MESSAGE } from './dashboard.constants';
import { AdminDashboardPage } from './admin-dashboard-page';

describe('AdminDashboardPage', () => {
  it('renders dashboard heading and setup banner', () => {
    render(
      <AdminDashboardPage
        statsState={{ status: 'setup', message: ADMIN_DASHBOARD_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_DASHBOARD_SETUP_MESSAGE,
    );
  });

  it('renders stat placeholders', () => {
    render(
      <AdminDashboardPage
        statsState={{ status: 'setup', message: ADMIN_DASHBOARD_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);
  });
});
