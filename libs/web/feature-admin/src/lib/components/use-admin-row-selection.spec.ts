import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAdminRowSelection } from './use-admin-row-selection';

describe('useAdminRowSelection', () => {
  it('toggles rows and select-all for selectable ids only', () => {
    const { result } = renderHook(() =>
      useAdminRowSelection({
        rowIds: ['a', 'b', 'c'],
        isRowSelectable: (id) => id !== 'b',
      }),
    );

    act(() => {
      result.current.toggleRow('a');
      result.current.toggleRow('b');
    });

    expect(result.current.selectedIds).toEqual(['a']);

    act(() => {
      result.current.toggleAllVisible();
    });

    expect(result.current.selectedIds).toEqual(['a', 'c']);

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedIds).toEqual([]);
  });
});
