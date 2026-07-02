import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SubscriptionsPage } from './subscriptions-page';

vi.mock('./components/subscription-checkout-button', () => ({
  SubscriptionCheckoutButton: () => <button type="button">Subscribe</button>,
}));

const plans = [
  {
    id: 'plan-1',
    name: 'All Access Monthly',
    slug: 'all-access-monthly',
    interval: 'month',
    intervalCount: 1,
    games: [
      {
        id: 'game-1',
        title: 'Demo Game',
        slug: 'demo-game-1',
        coverImage: null,
      },
    ],
  },
];

describe('SubscriptionsPage', () => {
  it('renders available plans', () => {
    render(
      <SubscriptionsPage plans={plans} selectedPlanSlug="all-access-monthly" />,
    );

    expect(screen.getByRole('heading', { name: 'Join The Pass' })).toBeTruthy();
    expect(screen.getByText('All Access Monthly')).toBeTruthy();
    expect(screen.getByText('Demo Game')).toBeTruthy();
    expect(
      screen.getByTestId('subscription-plan-all-access-monthly'),
    ).toBeTruthy();
  });

  it('shows empty state when no plans exist', () => {
    render(<SubscriptionsPage plans={[]} />);

    expect(
      screen.getByText('Subscription plans are not available yet. Check back soon.'),
    ).toBeTruthy();
  });
});
