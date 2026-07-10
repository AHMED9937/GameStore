'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiErrorMessage,
  isSetupResponse,
  isTransientApiError,
} from '@gamestore/web/data-access';
import type { AdminAsyncState } from '../types/admin-async-state';

type AdminResourceOptions<T> = {
  deps?: unknown[];
  isEmpty?: (data: T) => boolean;
};

export type AdminResourceResult<T> = {
  state: AdminAsyncState<T>;
  refetch: () => void;
  isRefetching: boolean;
};

const AUTO_RETRY_DELAY_MS = 500;

async function runLoader<T>(
  loader: () => Promise<unknown>,
  parseSuccess: (data: unknown) => T,
  options: AdminResourceOptions<T> | undefined,
): Promise<AdminAsyncState<T>> {
  const result = await loader();
  if (isSetupResponse(result)) {
    return { status: 'setup', message: result.message };
  }
  const data = parseSuccess(result);
  if (options?.isEmpty?.(data)) {
    return { status: 'empty' };
  }
  return { status: 'success', data };
}

export function useAdminResourceState<T>(
  loader: () => Promise<unknown>,
  parseSuccess: (data: unknown) => T,
  options?: AdminResourceOptions<T>,
): AdminResourceResult<T> {
  const [state, setState] = useState<AdminAsyncState<T>>({ status: 'idle' });
  const [isRefetching, setIsRefetching] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const deps = options?.deps ?? [];
  const loaderRef = useRef(loader);
  const parseRef = useRef(parseSuccess);
  const optionsRef = useRef(options);

  loaderRef.current = loader;
  parseRef.current = parseSuccess;
  optionsRef.current = options;

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const depsKey = JSON.stringify(deps);
  const prevDepsKeyRef = useRef(depsKey);

  useEffect(() => {
    let cancelled = false;
    const depsChanged = prevDepsKeyRef.current !== depsKey;
    prevDepsKeyRef.current = depsKey;

    const keepPreviousData =
      !depsChanged &&
      reloadToken > 0 &&
      (state.status === 'success' || state.status === 'empty');

    if (!keepPreviousData) {
      setState({ status: 'loading' });
    }
    setIsRefetching(keepPreviousData);

    async function load() {
      try {
        const nextState = await runLoader(
          () => loaderRef.current(),
          (data) => parseRef.current(data),
          optionsRef.current,
        );
        if (cancelled) {
          return;
        }
        setState(nextState);
        setIsRefetching(false);
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        if (isTransientApiError(error)) {
          await new Promise((resolve) => setTimeout(resolve, AUTO_RETRY_DELAY_MS));
          if (cancelled) {
            return;
          }
          try {
            const recovered = await runLoader(
              () => loaderRef.current(),
              (data) => parseRef.current(data),
              optionsRef.current,
            );
            if (cancelled) {
              return;
            }
            setState(recovered);
            setIsRefetching(false);
            return;
          } catch (retryError: unknown) {
            if (cancelled) {
              return;
            }
            setState({ status: 'error', message: apiErrorMessage(retryError) });
            setIsRefetching(false);
            return;
          }
        }
        setState({ status: 'error', message: apiErrorMessage(error) });
        setIsRefetching(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadToken triggers manual refetch; depsKey tracks param changes
  }, [depsKey, reloadToken]);

  return { state, refetch, isRefetching };
}

export function useAdminListState<T>(
  loader: () => Promise<unknown>,
  parseList: (data: unknown) => T[],
  deps: unknown[] = [],
): AdminResourceResult<T[]> {
  return useAdminResourceState(loader, parseList, {
    deps,
    isEmpty: (list) => list.length === 0,
  });
}

export function useAdminSetupState(
  loader: () => Promise<unknown>,
  deps: unknown[] = [],
): AdminResourceResult<null> {
  return useAdminResourceState(loader, () => null, { deps });
}
