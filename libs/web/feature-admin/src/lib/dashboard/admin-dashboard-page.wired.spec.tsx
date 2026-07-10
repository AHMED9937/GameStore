import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminStats } from '@gamestore/web/data-access';
import { AdminDashboardPage } from './admin-dashboard-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminStats: vi.fn(),
  };
});

const mockStats = {
  publishedGames: 6,
  activeLicenses: 9,
  poolAccounts: 2,
  ordersToday: 1,
  recentActivity: [
    {
      id: 'log-1',
      action: 'license.create',
      resource: 'license',
      resourceId: 'lic-1',
      actorEmail: 'admin@example.com',
      createdAt: '2026-07-08T12:00:00.000Z',
    },
  ],
};

describe('AdminDashboardPage wired', () => {
  it('loads and renders live dashboard stats', async () => {
    vi.mocked(getAdminStats).mockResolvedValue(mockStats);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard-stats').textContent).toContain('6');
    });

    expect(screen.getByText('license.create')).toBeTruthy();
    expect(screen.queryByTestId('admin-setup-banner')).toBeNull();
  });
});
