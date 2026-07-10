import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminDashboardPage } from './admin-dashboard-page';
import type { AdminDashboardStats } from './dashboard.types';

const mockStats: AdminDashboardStats = {
  publishedGames: 12,
  activeLicenses: 34,
  poolAccounts: 5,
  ordersToday: 2,
  recentActivity: [
    {
      id: 'log-1',
      action: 'game.publish',
      resource: 'game',
      resourceId: 'game-1',
      actorEmail: 'admin@example.com',
      createdAt: '2026-07-08T10:00:00.000Z',
    },
  ],
};

describe('AdminDashboardPage', () => {
  it('renders dashboard heading and live stats', () => {
    render(
      <AdminDashboardPage statsState={{ status: 'success', data: mockStats }} />,
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByTestId('admin-dashboard-stats').textContent).toContain('12');
    expect(screen.getByTestId('admin-dashboard-stats').textContent).toContain('34');
    expect(screen.getByTestId('admin-dashboard-stats').textContent).toContain('5');
    expect(screen.getByTestId('admin-dashboard-stats').textContent).toContain('2');
    expect(screen.queryByTestId('admin-setup-banner')).toBeNull();
  });

  it('renders recent activity rows', () => {
    render(
      <AdminDashboardPage statsState={{ status: 'success', data: mockStats }} />,
    );

    expect(screen.getByTestId('admin-dashboard-activity-table')).toBeTruthy();
    expect(screen.getByText('game.publish')).toBeTruthy();
    expect(screen.getByText('admin@example.com')).toBeTruthy();
  });

  it('renders quick action links', () => {
    render(
      <AdminDashboardPage statsState={{ status: 'success', data: mockStats }} />,
    );

    expect(screen.getByRole('link', { name: 'Add game' }).getAttribute('href')).toBe(
      '/admin/games/new',
    );
    expect(screen.getByRole('link', { name: 'Import from IGDB' }).getAttribute('href')).toBe(
      '/admin/igdb',
    );
  });
});
