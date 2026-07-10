import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminDashboardStatsGrid } from './admin-dashboard-stats-grid';
import type { AdminDashboardStats } from './dashboard.types';

const mockStats: AdminDashboardStats = {
  publishedGames: 8,
  activeLicenses: 21,
  poolAccounts: 3,
  ordersToday: 4,
  recentActivity: [],
};

describe('AdminDashboardStatsGrid', () => {
  it('renders stat labels and formatted values', () => {
    render(<AdminDashboardStatsGrid stats={mockStats} />);

    expect(screen.getByText('Published games')).toBeTruthy();
    expect(screen.getByText('Active licenses')).toBeTruthy();
    expect(screen.getByText('Pool accounts')).toBeTruthy();
    expect(screen.getByText('Orders today')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('21')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('links each stat card to the related admin section', () => {
    render(<AdminDashboardStatsGrid stats={mockStats} />);

    expect(screen.getByRole('link', { name: /Published games/i }).getAttribute('href')).toBe(
      '/admin/games',
    );
    expect(screen.getByRole('link', { name: /Active licenses/i }).getAttribute('href')).toBe(
      '/admin/licenses',
    );
  });
});
