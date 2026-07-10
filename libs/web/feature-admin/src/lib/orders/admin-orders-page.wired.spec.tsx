import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminOrders } from '@gamestore/web/data-access';
import {
  applyDebouncedSearchFilter,
  changeSelectFilter,
} from '../testing/admin-list-filters.test-utils';
import { AdminOrdersPage } from './admin-orders-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminOrders: vi.fn(),
  };
});

const mockOrders = [
  {
    id: 'order-1',
    status: 'completed',
    orderType: 'one_time',
    amount: '19.99',
    currency: 'USD',
    buyerEmail: 'buyer@example.com',
    ownerEmail: null,
    gameTitle: 'Stellar Odyssey',
    gameSlug: 'stellar-odyssey',
    licenseKeyMasked: 'GS-****-ABCD',
    licenseSource: 'purchase',
    createdAt: '2025-06-30T12:00:00.000Z',
  },
  {
    id: 'order-2',
    status: 'pending',
    orderType: 'one_time',
    amount: '9.99',
    currency: 'USD',
    buyerEmail: null,
    ownerEmail: null,
    gameTitle: 'Demo Game',
    gameSlug: 'demo-game',
    licenseKeyMasked: null,
    licenseSource: null,
    createdAt: '2025-06-29T12:00:00.000Z',
  },
];

describe('AdminOrdersPage wired', () => {
  it('requests API with order filters', async () => {
    vi.mocked(getAdminOrders).mockResolvedValue(mockOrders);

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-orders-table')).toBeTruthy();
    });

    await applyDebouncedSearchFilter('Filter orders by game or buyer', 'stellar');
    changeSelectFilter('Filter orders by status', 'completed');
    changeSelectFilter('Filter orders by type', 'one_time');

    await waitFor(() => {
      expect(getAdminOrders).toHaveBeenLastCalledWith({
        q: 'stellar',
        status: 'completed',
        orderType: 'one_time',
      });
    });
  });

  it('shows bulk toolbar when a deletable order is selected', async () => {
    vi.mocked(getAdminOrders).mockResolvedValue(mockOrders);

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-row-checkbox-order-2')).toBeTruthy();
    });

    expect(screen.queryByTestId('admin-bulk-toolbar')).toBeNull();
    fireEvent.click(screen.getByTestId('admin-row-checkbox-order-2'));
    expect(screen.getByTestId('admin-bulk-toolbar')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeTruthy();
  });
});
