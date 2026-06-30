import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiPatch, apiPut } from './api-client';

describe('api-client admin verbs', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    window.Clerk = {
      session: {
        getToken: vi.fn().mockResolvedValue('clerk-test-token'),
      },
    };
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.Clerk;
  });

  it('apiPut sends Authorization header', async () => {
    await apiPut('/admin/games/1', { title: 'Test' });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PUT');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer clerk-test-token',
    );
  });

  it('apiPatch sends Authorization header', async () => {
    await apiPatch('/admin/games/1', { title: 'Test' });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PATCH');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer clerk-test-token',
    );
  });

  it('apiDelete sends Authorization header', async () => {
    await apiDelete('/admin/games/1');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('DELETE');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer clerk-test-token',
    );
  });
});
