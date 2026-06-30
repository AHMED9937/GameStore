import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminAuditPage } from './admin-audit-page';
import { ADMIN_AUDIT_SETUP_MESSAGE } from './audit.constants';

describe('AdminAuditPage', () => {
  it('renders audit heading, setup banner, and pagination placeholders', () => {
    render(
      <AdminAuditPage
        listState={{ status: 'setup', message: ADMIN_AUDIT_SETUP_MESSAGE }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Audit log' })).toBeTruthy();
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      ADMIN_AUDIT_SETUP_MESSAGE,
    );
    expect(screen.getByTestId('admin-audit-filters')).toBeTruthy();
    expect(screen.getByTestId('admin-audit-pagination')).toBeTruthy();
    expect(screen.getByText('Page 1 of —')).toBeTruthy();
  });

  it('renders loading spinner', () => {
    render(<AdminAuditPage listState={{ status: 'loading' }} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders error message', () => {
    render(
      <AdminAuditPage listState={{ status: 'error', message: 'Forbidden' }} />,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Forbidden');
  });

  it('renders audit table on success', () => {
    render(
      <AdminAuditPage
        listState={{
          status: 'success',
          data: [
            {
              id: 'log-1',
              createdAt: '2025-06-30T12:00:00Z',
              actorEmail: 'admin@example.com',
              action: 'game.publish',
              resource: 'demo-game-1',
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('admin-audit-table')).toBeTruthy();
    expect(screen.getByText('game.publish')).toBeTruthy();
  });
});
