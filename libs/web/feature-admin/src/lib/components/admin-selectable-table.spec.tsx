import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AdminSelectableRow,
  AdminSelectableTable,
} from './admin-selectable-table';

describe('AdminSelectableTable', () => {
  it('renders select-all and row checkboxes', () => {
    render(
      <AdminSelectableTable
        columns={[{ key: 'name', header: 'Name' }]}
        selectedCount={1}
        allVisibleSelected={false}
        someVisibleSelected={true}
        onToggleAllVisible={vi.fn()}
      >
        <AdminSelectableRow
          id="row-1"
          selected={true}
          onToggle={vi.fn()}
        >
          <td>Demo</td>
        </AdminSelectableRow>
      </AdminSelectableTable>,
    );

    expect(screen.getByTestId('admin-select-all-checkbox')).toBeTruthy();
    expect(screen.getByTestId('admin-row-checkbox-row-1')).toBeTruthy();
    expect(screen.getByText('Demo')).toBeTruthy();
  });
});
