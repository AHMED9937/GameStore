'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
  ApiError,
  apiErrorMessage,
  fetchOrderBySession,
  isTransientApiError,
} from '@gamestore/web/data-access';
import type { OrderFulfillmentState } from '../types/order-fulfillment-state';

const MAX_POLL_ATTEMPTS = 12;
const MAX_TRANSIENT_RETRIES = 5;
const MAX_AUTH_WARMUP_403_RETRIES = 5;
const AUTH_TOKEN_WARMUP_MS = 2000;
const AUTH_TOKEN_RETRY_MS = 100;
const POLL_DELAYS_MS = [1000, 2000, 3000];
const TRANSIENT_RETRY_DELAYS_MS = [1000, 1500, 2000, 2500, 3000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollDelayMs(attemptIndex: number): number {
  return POLL_DELAYS_MS[Math.min(attemptIndex, POLL_DELAYS_MS.length - 1)];
}

function transientRetryDelayMs(attemptIndex: number): number {
  return TRANSIENT_RETRY_DELAYS_MS[
    Math.min(attemptIndex, TRANSIENT_RETRY_DELAYS_MS.length - 1)
  ];
}

function buildSignInHref(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const redirect = encodeURIComponent(
    `${window.location.pathname}${window.location.search}`,
  );
  return `/sign-in?redirect_url=${redirect}`;
}

function mapTerminalError(error: unknown): OrderFulfillmentState {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return { status: 'error', message: 'Order not found.' };
    }
    if (error.status === 403) {
      return {
        status: 'error',
        message: apiErrorMessage(
          error,
          'Sign in with the account used to purchase.',
        ),
        signInHref: buildSignInHref(),
      };
    }
  }

  return {
    status: 'error',
    message: apiErrorMessage(
      error,
      'Could not reach the server. Ensure the API is running and try again.',
    ),
  };
}

export function useOrderFulfillment(
  sessionId: string | null,
): OrderFulfillmentState {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [state, setState] = useState<OrderFulfillmentState>({ status: 'loading' });
  const [authTokenReady, setAuthTokenReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      setAuthTokenReady(false);
      return;
    }

    if (!isSignedIn) {
      setAuthTokenReady(true);
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    setAuthTokenReady(false);

    const warmToken = async () => {
      while (!cancelled && Date.now() - startedAt < AUTH_TOKEN_WARMUP_MS) {
        try {
          const token = await getToken();
          if (token) {
            if (!cancelled) {
              setAuthTokenReady(true);
            }
            return;
          }
        } catch {
          // Retry until warmup timeout.
        }
        await sleep(AUTH_TOKEN_RETRY_MS);
      }

      if (!cancelled) {
        setAuthTokenReady(true);
      }
    };

    void warmToken();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const authReady = isLoaded && authTokenReady;

  useEffect(() => {
    const id = sessionId?.trim();
    if (!id) {
      setState({
        status: 'error',
        message: 'Invalid checkout session.',
      });
      return;
    }

    if (!authReady) {
      setState({ status: 'loading' });
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let pollAttempt = 0;
    let transientAttempt = 0;
    let authWarmup403Attempt = 0;

    const finish = (next: OrderFulfillmentState) => {
      if (!cancelled) {
        setState(next);
      }
    };

    const schedule = (delayMs: number, run: () => void) => {
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          run();
        }
      }, delayMs);
    };

    const shouldRetry403 = () =>
      !isLoaded || (isSignedIn && !authTokenReady);

    const poll = async () => {
      if (cancelled) {
        return;
      }

      try {
        const result = await fetchOrderBySession(id, {
          getAuthToken: isSignedIn ? () => getToken() : undefined,
        });

        if (cancelled) {
          return;
        }

        transientAttempt = 0;
        authWarmup403Attempt = 0;

        if (result.status === 'completed') {
          finish({
            status: 'success',
            order: result.order,
            license: result.license,
          });
          return;
        }

        if (result.status === 'failed') {
          finish({
            status: 'error',
            message: result.message || 'Payment was not completed.',
          });
          return;
        }

        finish({
          status: 'pending',
          message: result.message || 'Processing your order…',
        });

        pollAttempt += 1;
        if (pollAttempt >= MAX_POLL_ATTEMPTS) {
          finish({
            status: 'error',
            message:
              'Taking longer than expected. Check My Games in a few minutes or contact support if your license does not appear.',
          });
          return;
        }

        schedule(pollDelayMs(pollAttempt - 1), () => {
          void poll();
        });
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 403 &&
          shouldRetry403() &&
          authWarmup403Attempt < MAX_AUTH_WARMUP_403_RETRIES
        ) {
          authWarmup403Attempt += 1;
          finish({ status: 'loading' });
          schedule(transientRetryDelayMs(authWarmup403Attempt - 1), () => {
            void poll();
          });
          return;
        }

        if (isTransientApiError(error)) {
          transientAttempt += 1;
          if (transientAttempt <= MAX_TRANSIENT_RETRIES) {
            finish({
              status: 'pending',
              message: 'Confirming your payment…',
            });
            schedule(transientRetryDelayMs(transientAttempt - 1), () => {
              void poll();
            });
            return;
          }
        }

        finish(mapTerminalError(error));
      }
    };

    setState({ status: 'loading' });
    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessionId, authReady, isSignedIn, getToken, isLoaded, authTokenReady]);

  return state;
}
