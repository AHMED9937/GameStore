import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminOrdersPage } from './admin-orders-page';
import { ADMIN_ORDERS_SETUP_MESSAGE } from './orders.constants';

describe('AdminOrdersPage', () => {
  it('renders orders heading and setup banner by default', () => {
    render(
      <AdminOrdersPage
        listState={{ status: 'setup', message: ADMIN_ORDERS_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_ORDERS_SETUP_MESSAGE,
    );
  });

  it('renders loading spinner', () => {
    render(<AdminOrdersPage listState={{ status: 'loading' }} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminOrdersPage listState={{ status: 'error', message: 'Forbidden' }} />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Forbidden');
  });
});
