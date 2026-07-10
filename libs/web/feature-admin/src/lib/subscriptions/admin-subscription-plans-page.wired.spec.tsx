import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminSubscriptionPlans } from '@gamestore/web/data-access';
import {
  applyDebouncedSearchFilter,
  changeSelectFilter,
} from '../testing/admin-list-filters.test-utils';
import { AdminSubscriptionPlansPage } from './admin-subscription-plans-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminSubscriptionPlans: vi.fn(),
  };
});

const mockPlans = [
  {
    id: 'plan-1',
    name: 'Monthly Pass',
    slug: 'monthly-pass',
    stripePriceId: 'price_123',
    interval: 'month',
    intervalCount: 1,
    isActive: true,
    gameCount: 2,
  },
];

describe('AdminSubscriptionPlansPage wired', () => {
  it('requests API with subscription plan filters', async () => {
    vi.mocked(getAdminSubscriptionPlans).mockResolvedValue(mockPlans);

    render(<AdminSubscriptionPlansPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-subscription-plans-table')).toBeTruthy();
    });

    await applyDebouncedSearchFilter(
      'Filter subscription plans by name or slug',
      'monthly',
    );
    changeSelectFilter('Filter subscription plans by status', 'active');

    await waitFor(() => {
      expect(getAdminSubscriptionPlans).toHaveBeenLastCalledWith({
        q: 'monthly',
        status: 'active',
      });
    });
  });
});
