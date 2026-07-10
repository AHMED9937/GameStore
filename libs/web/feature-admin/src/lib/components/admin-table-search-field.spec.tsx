import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminTableSearchField } from './admin-table-search-field';

describe('AdminTableSearchField', () => {
  it('renders label and forwards input changes', () => {
    const onChange = vi.fn();

    render(
      <AdminTableSearchField
        label="Search"
        value=""
        placeholder="Search games…"
        ariaLabel="Filter games by title"
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Search')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Filter games by title'), {
      target: { value: 'halo' },
    });
    expect(onChange).toHaveBeenCalledWith('halo');
  });
});
