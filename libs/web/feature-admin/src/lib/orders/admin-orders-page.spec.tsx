import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminOrdersPage } from './admin-orders-page';

const mockOrders = [
  {
    id: 'order-1',
    status: 'completed',
    amount: '19.99',
    currency: 'USD',
    buyerEmail: 'buyer@example.com',
    ownerEmail: null,
    gameTitle: 'Stellar Odyssey',
    gameSlug: 'stellar-odyssey',
    licenseKeyMasked: 'GS-****-ABCD',
    createdAt: '2025-06-30T12:00:00.000Z',
  },
  {
    id: 'order-2',
    status: 'pending',
    amount: '9.99',
    currency: 'USD',
    buyerEmail: null,
    ownerEmail: null,
    gameTitle: 'Demo Game',
    gameSlug: 'demo-game',
    licenseKeyMasked: null,
    createdAt: '2025-06-29T12:00:00.000Z',
  },
];

describe('AdminOrdersPage', () => {
  it('renders orders table with status badges', () => {
    render(
      <AdminOrdersPage listState={{ status: 'success', data: mockOrders }} />,
    );
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeTruthy();
    expect(screen.getByTestId('admin-orders-table')).toBeTruthy();
    expect(screen.getByText('Stellar Odyssey')).toBeTruthy();
    expect(screen.getByText('GS-****-ABCD')).toBeTruthy();
    expect(screen.getByTestId('order-status-order-1').textContent).toBe('completed');
    expect(screen.getByTestId('order-status-order-2').textContent).toBe('pending');
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

  it('renders empty state', () => {
    render(<AdminOrdersPage listState={{ status: 'empty' }} />);
    expect(screen.getByText('No orders yet.')).toBeTruthy();
  });
});
