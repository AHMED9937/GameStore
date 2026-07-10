import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminAuditLogs } from '@gamestore/web/data-access';
import { applyDebouncedSearchFilter } from '../testing/admin-list-filters.test-utils';
import { AdminAuditPage } from './admin-audit-page';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminAuditLogs: vi.fn(),
  };
});

describe('AdminAuditPage wired', () => {
  it('requests paginated audit logs with search filter', async () => {
    vi.mocked(getAdminAuditLogs).mockResolvedValue({
      items: [
        {
          id: 'log-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          actorEmail: 'admin@example.com',
          action: 'admin.game.create',
          resource: 'game',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(<AdminAuditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-audit-table')).toBeTruthy();
    });

    await applyDebouncedSearchFilter(
      'Filter audit log by action, resource, or actor',
      'game.create',
    );

    await waitFor(() => {
      expect(getAdminAuditLogs).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        q: 'game.create',
      });
    });
  });
});
