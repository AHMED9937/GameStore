'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  apiErrorMessage,
  fetchOrderBySession,
} from '@gamestore/web/data-access';
import type { OrderFulfillmentState } from '../types/order-fulfillment-state';

const MAX_POLL_ATTEMPTS = 12;
const POLL_DELAYS_MS = [1000, 2000, 3000];

function pollDelayMs(attemptIndex: number): number {
  return POLL_DELAYS_MS[Math.min(attemptIndex, POLL_DELAYS_MS.length - 1)];
}

function mapLookupError(error: unknown): OrderFulfillmentState {
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
      };
    }
  }

  return {
    status: 'error',
    message: apiErrorMessage(error, 'Could not reach the server. Try again.'),
  };
}

export function useOrderFulfillment(
  sessionId: string | null,
): OrderFulfillmentState {
  const [state, setState] = useState<OrderFulfillmentState>({ status: 'loading' });

  useEffect(() => {
    const id = sessionId?.trim();
    if (!id) {
      setState({
        status: 'error',
        message: 'Invalid checkout session.',
      });
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const finish = (next: OrderFulfillmentState) => {
      if (!cancelled) {
        setState(next);
      }
    };

    const poll = async () => {
      if (cancelled) {
        return;
      }

      try {
        const result = await fetchOrderBySession(id);

        if (cancelled) {
          return;
        }

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

        finish({ status: 'pending', message: result.message });

        attempt += 1;
        if (attempt >= MAX_POLL_ATTEMPTS) {
          finish({
            status: 'error',
            message:
              'Taking longer than expected. Check My Games in a few minutes or contact support if your license does not appear.',
          });
          return;
        }

        timeoutId = setTimeout(() => {
          void poll();
        }, pollDelayMs(attempt - 1));
      } catch (error) {
        finish(mapLookupError(error));
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
  }, [sessionId]);

  return state;
}
