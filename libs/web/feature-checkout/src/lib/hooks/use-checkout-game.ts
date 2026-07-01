'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  apiErrorMessage,
  getGameBySlug,
  type GameDetail,
} from '@gamestore/web/data-access';
import type { CheckoutAsyncState } from '../types/checkout-async-state';

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

    getGameBySlug(slug.trim())
      .then((game) => {
        if (!cancelled) {
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
