import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminBulkToolbar } from './admin-bulk-toolbar';

describe('AdminBulkToolbar', () => {
  it('renders nothing when no rows are selected', () => {
    const { container } = render(
      <AdminBulkToolbar selectedCount={0} onClear={() => undefined}>
        <button type="button">Action</button>
      </AdminBulkToolbar>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders selected count and actions', () => {
    render(
      <AdminBulkToolbar selectedCount={2} onClear={() => undefined}>
        <button type="button">Delete selected</button>
      </AdminBulkToolbar>,
    );

    expect(screen.getByTestId('admin-bulk-toolbar')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeTruthy();
  });
});
