import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAdminListFilters } from './use-admin-list-filters';

type TestFilters = {
  q: string;
  status: string;
};

describe('useAdminListFilters', () => {
  it('applies select filters immediately', () => {
    const { result } = renderHook(() =>
      useAdminListFilters<TestFilters>({
        initial: { q: '', status: '' },
        textKeys: ['q'],
        debounceMs: 300,
      }),
    );

    act(() => {
      result.current.setDraft({ status: 'active' });
    });

    expect(result.current.draft.status).toBe('active');
    expect(result.current.applied.status).toBe('active');
    expect(result.current.activeFilters).toEqual({ status: 'active' });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('debounces text filter application', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAdminListFilters<TestFilters>({
        initial: { q: '', status: '' },
        textKeys: ['q'],
        debounceMs: 300,
      }),
    );

    act(() => {
      result.current.setDraft({ q: 'demo' });
    });

    expect(result.current.applied.q).toBe('');
    expect(result.current.draft.q).toBe('demo');

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.applied.q).toBe('demo');
    expect(result.current.activeFilters).toEqual({ q: 'demo' });

    vi.useRealTimers();
  });
});
