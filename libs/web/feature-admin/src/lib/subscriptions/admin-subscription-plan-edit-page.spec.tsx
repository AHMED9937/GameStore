import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminSubscriptionPlanEditPage } from './admin-subscription-plan-edit-page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@gamestore/web/data-access', () => ({
  getAdminSubscriptionPlan: vi.fn().mockResolvedValue({
    id: 'plan-1',
    name: 'All Access',
    slug: 'all-access-monthly',
    stripePriceId: 'price_test_monthly',
    interval: 'month',
    intervalCount: 1,
    isActive: true,
    games: [
      { id: 'game-1', title: 'Demo Game', slug: 'demo-game-1', published: true },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
  updateAdminSubscriptionPlan: vi.fn(),
  deleteAdminSubscriptionPlan: vi.fn(),
  getAdminGames: vi.fn().mockResolvedValue([
    {
      id: 'game-1',
      title: 'Demo Game',
      slug: 'demo-game-1',
      published: true,
    },
  ]),
  isSetupResponse: () => false,
  apiErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'Request failed',
}));

describe('AdminSubscriptionPlanEditPage', () => {
  it('renders plan details and save actions', async () => {
    render(<AdminSubscriptionPlanEditPage planId="plan-1" />);

    expect(
      await screen.findByRole('heading', { name: 'Edit subscription plan' }),
    ).toBeTruthy();
    expect(screen.getByTestId('admin-subscription-plan-status')).toBeTruthy();
    expect(screen.getByDisplayValue('All Access')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete plan' })).toBeTruthy();
  });
});
