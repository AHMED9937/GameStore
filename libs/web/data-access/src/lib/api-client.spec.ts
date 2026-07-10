import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from './api-client';

describe('api-client retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retries transient 503 responses and succeeds on the next attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'busy' }), { status: 503 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'g1' }]), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const promise = apiGet<unknown[]>('/admin/games');
    await vi.advanceTimersByTimeAsync(300);
    const result = await promise;

    expect(result).toEqual([{ id: 'g1' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries abort errors before surfacing failure', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('aborted', 'AbortError'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const promise = apiGet<{ ok: boolean }>('/admin/games');
    await vi.advanceTimersByTimeAsync(300);
    const result = await promise;

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient 404 responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/admin/games/missing')).rejects.toMatchObject({
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses getAuthToken override when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const getAuthToken = vi.fn().mockResolvedValue('override-jwt');

    await apiGet<{ ok: boolean }>('/orders/by-session/cs_test', undefined, {
      getAuthToken,
    });

    expect(getAuthToken).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/orders/by-session/cs_test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer override-jwt',
        }),
      }),
    );
  });
});
