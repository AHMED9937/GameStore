'use client';

import { useEffect, useState } from 'react';
import { apiErrorMessage, isSetupResponse } from '@gamestore/web/data-access';
import type { AdminAsyncState } from '../types/admin-async-state';

type AdminResourceOptions<T> = {
  deps?: unknown[];
  isEmpty?: (data: T) => boolean;
};

export function useAdminResourceState<T>(
  loader: () => Promise<unknown>,
  parseSuccess: (data: unknown) => T,
  options?: AdminResourceOptions<T>,
): AdminAsyncState<T> {
  const [state, setState] = useState<AdminAsyncState<T>>({ status: 'idle' });
  const deps = options?.deps ?? [];

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    loader()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (isSetupResponse(result)) {
          setState({ status: 'setup', message: result.message });
          return;
        }
        const data = parseSuccess(result);
        if (options?.isEmpty?.(data)) {
          setState({ status: 'empty' });
          return;
        }
        setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setState({ status: 'error', message: apiErrorMessage(error) });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loader identity is intentionally unstable
  }, deps);

  return state;
}

export function useAdminListState<T>(
  loader: () => Promise<unknown>,
  parseList: (data: unknown) => T[],
  deps: unknown[] = [],
): AdminAsyncState<T[]> {
  return useAdminResourceState(loader, parseList, {
    deps,
    isEmpty: (list) => list.length === 0,
  });
}

export function useAdminSetupState(
  loader: () => Promise<unknown>,
  deps: unknown[] = [],
): AdminAsyncState<null> {
  return useAdminResourceState(loader, () => null, { deps });
}
