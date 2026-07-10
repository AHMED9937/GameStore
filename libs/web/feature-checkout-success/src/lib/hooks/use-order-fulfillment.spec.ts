import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@gamestore/web/data-access';
import { useOrderFulfillment } from './use-order-fulfillment';

const fetchOrderBySession = vi.fn();
const getToken = vi.fn();
const useAuth = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => useAuth(),
}));

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    fetchOrderBySession: (...args: unknown[]) => fetchOrderBySession(...args),
  };
});

const completedResult = {
  status: 'completed' as const,
  order: {
    id: 'order-1',
    amount: '9.99',
    currency: 'usd',
    buyerEmail: 'buyer@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  license: {
    licenseKey: 'GS-REAL-KEY',
    status: 'available',
    game: { id: 'game-1', title: 'Demo Game', slug: 'demo-game' },
  },
};

function mockAuthReady(options?: {
  isSignedIn?: boolean;
  getToken?: () => Promise<string | null>;
}) {
  useAuth.mockReturnValue({
    isLoaded: true,
    isSignedIn: options?.isSignedIn ?? false,
    getToken: options?.getToken ?? getToken,
  });
  getToken.mockResolvedValue('jwt-test');
}

describe('useOrderFulfillment', () => {
  beforeEach(() => {
    fetchOrderBySession.mockReset();
    getToken.mockReset();
    useAuth.mockReset();
    mockAuthReady();
  });

  it('returns error when session id is missing', () => {
    const { result } = renderHook(() => useOrderFulfillment(null));
    expect(result.current).toEqual({
      status: 'error',
      message: 'Invalid checkout session.',
    });
  });

  it('stays loading until Clerk is loaded', async () => {
    useAuth.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      getToken,
    });

    const { result, rerender } = renderHook(() =>
      useOrderFulfillment('cs_test_loading'),
    );

    expect(result.current).toEqual({ status: 'loading' });
    expect(fetchOrderBySession).not.toHaveBeenCalled();

    useAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      getToken,
    });
    fetchOrderBySession.mockResolvedValue(completedResult);
    rerender();

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });

  it('waits for Clerk token when signed in before polling', async () => {
    let resolveToken: (value: string) => void = () => undefined;
    const tokenPromise = new Promise<string>((resolve) => {
      resolveToken = resolve;
    });

    useAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      getToken: () => tokenPromise,
    });

    fetchOrderBySession.mockResolvedValue(completedResult);

    const { result } = renderHook(() => useOrderFulfillment('cs_test_token_wait'));

    expect(result.current).toEqual({ status: 'loading' });
    expect(fetchOrderBySession).not.toHaveBeenCalled();

    resolveToken('jwt-ready');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(fetchOrderBySession).toHaveBeenCalledWith('cs_test_token_wait', {
      getAuthToken: expect.any(Function),
    });
  });

  it('polls pending then resolves to success', async () => {
    fetchOrderBySession
      .mockResolvedValueOnce({ status: 'pending', message: 'Processing…' })
      .mockResolvedValueOnce(completedResult);

    const { result } = renderHook(() => useOrderFulfillment('cs_test_pending'));

    await waitFor(() => {
      expect(result.current.status).toBe('pending');
    });

    await waitFor(
      () => {
        expect(result.current.status).toBe('success');
      },
      { timeout: 3000 },
    );

    expect(result.current).toMatchObject({
      status: 'success',
      license: expect.objectContaining({ licenseKey: 'GS-REAL-KEY' }),
    });
  }, 10_000);

  it('retries transient 503 errors before succeeding', async () => {
    fetchOrderBySession
      .mockRejectedValueOnce(new ApiError(503, JSON.stringify({ error: 'busy' })))
      .mockResolvedValueOnce(completedResult);

    const { result } = renderHook(() => useOrderFulfillment('cs_test_retry'));

    await waitFor(
      () => {
        expect(result.current.status).toBe('success');
      },
      { timeout: 3000 },
    );

    expect(fetchOrderBySession).toHaveBeenCalledTimes(2);
  }, 10_000);

  it('maps 404 to terminal error', async () => {
    fetchOrderBySession.mockRejectedValue(new ApiError(404, 'not found'));

    const { result } = renderHook(() => useOrderFulfillment('cs_test_missing'));

    await waitFor(() => {
      expect(result.current).toEqual({
        status: 'error',
        message: 'Order not found.',
      });
    });
  });

  it('maps terminal 403 to error with sign-in href', async () => {
    mockAuthReady({ isSignedIn: true });
    fetchOrderBySession.mockRejectedValue(
      new ApiError(
        403,
        JSON.stringify({ message: 'Sign in with the account used to purchase' }),
      ),
    );

    const { result } = renderHook(() => useOrderFulfillment('cs_test_wrong_user'));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current).toMatchObject({
      status: 'error',
      message: 'Sign in with the account used to purchase',
      signInHref: expect.stringContaining('/sign-in?redirect_url='),
    });
  });

  it('maps failed order status to error', async () => {
    fetchOrderBySession.mockResolvedValue({
      status: 'failed',
      message: 'Payment was not completed.',
    });

    const { result } = renderHook(() => useOrderFulfillment('cs_test_failed'));

    await waitFor(() => {
      expect(result.current).toEqual({
        status: 'error',
        message: 'Payment was not completed.',
      });
    });
  });
});
