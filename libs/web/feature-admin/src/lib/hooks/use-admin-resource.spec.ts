import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@gamestore/web/data-access';
import { useAdminResourceState } from './use-admin-resource';

describe('useAdminResourceState', () => {
  it('loads success data', async () => {
    const loader = vi.fn().mockResolvedValue({ id: 'g1' });
    const { result } = renderHook(() =>
      useAdminResourceState(loader, (data) => data as { id: string }),
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });
    expect(result.current.state).toEqual({
      status: 'success',
      data: { id: 'g1' },
    });
  });

  it('retries transient errors before surfacing failure', async () => {
    let calls = 0;
    const loader = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        throw new ApiError(503, JSON.stringify({ error: 'busy' }));
      }
      return [{ id: 'g1' }];
    });

    const { result } = renderHook(() =>
      useAdminResourceState(loader, (data) => data as { id: string }[]),
    );

    await waitFor(
      () => {
        expect(result.current.state.status).toBe('success');
      },
      { timeout: 3_000 },
    );
    expect(loader.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('refetch invokes the loader again after an error', async () => {
    const loader = vi.fn().mockRejectedValue(new ApiError(403, 'Forbidden'));

    const { result } = renderHook(() =>
      useAdminResourceState(loader, (data) => data as { id: string }[]),
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe('error');
    });

    const callsBeforeRefetch = loader.mock.calls.length;

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(loader.mock.calls.length).toBeGreaterThan(callsBeforeRefetch);
    });
  });
});
