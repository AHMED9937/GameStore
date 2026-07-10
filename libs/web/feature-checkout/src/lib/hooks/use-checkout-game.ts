'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  apiErrorMessage,
  getGameBySlug,
  isTransientApiError,
  type GameDetail,
} from '@gamestore/web/data-access';
import type { CheckoutAsyncState } from '../types/checkout-async-state';

const MAX_TRANSIENT_RETRIES = 2;
const TRANSIENT_RETRY_DELAYS_MS = [1000, 2000];

async function loadGameWithRetry(slug: string): Promise<GameDetail> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt += 1) {
    try {
      return await getGameBySlug(slug);
    } catch (error) {
      lastError = error;
      if (!isTransientApiError(error) || attempt >= MAX_TRANSIENT_RETRIES) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, TRANSIENT_RETRY_DELAYS_MS[attempt] ?? 2000);
      });
    }
  }

  throw lastError;
}

export function useCheckoutGame(
  slug: string | null,
): CheckoutAsyncState<GameDetail> {
  const [state, setState] = useState<CheckoutAsyncState<GameDetail>>({
    status: 'idle',
  });

  useEffect(() => {
    if (!slug?.trim()) {
      setState({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    loadGameWithRetry(slug.trim())
      .then((game) => {
        if (!cancelled) {
          if (game.soldOut) {
            setState({
              status: 'error',
              message: 'This game is currently sold out.',
            });
            return;
          }
          setState({ status: 'success', data: game });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setState({
            status: 'error',
            message: 'This game could not be found.',
          });
          return;
        }

        setState({
          status: 'error',
          message: apiErrorMessage(error, 'Could not reach the server. Try again.'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}
