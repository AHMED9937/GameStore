import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminSubscriptionPlansPage } from './admin-subscription-plans-page';

const mockPlans = [
  {
    id: 'plan-1',
    name: 'All Access',
    slug: 'all-access-monthly',
    stripePriceId: 'price_test_monthly',
    interval: 'month',
    intervalCount: 1,
    isActive: true,
    gameCount: 2,
  },
];

describe('AdminSubscriptionPlansPage', () => {
  it('renders subscription plans table', () => {
    render(
      <AdminSubscriptionPlansPage
        listState={{ status: 'success', data: mockPlans }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Subscription plans' })).toBeTruthy();
    expect(screen.getByTestId('admin-subscription-plans-table')).toBeTruthy();
    expect(screen.getByText('All Access')).toBeTruthy();
    expect(screen.getByText('all-access-monthly')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Edit' }).getAttribute('href')).toBe(
      '/admin/subscriptions/plan-1',
    );
  });

  it('renders empty state', () => {
    render(<AdminSubscriptionPlansPage listState={{ status: 'empty' }} />);
    expect(screen.getByText('No subscription plans yet.')).toBeTruthy();
  });
});
