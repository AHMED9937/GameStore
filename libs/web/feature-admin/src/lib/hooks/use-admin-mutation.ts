'use client';

import { useCallback, useState } from 'react';
import { apiErrorMessage } from '@gamestore/web/data-access';

export type AdminMutationStatus = 'idle' | 'pending' | 'success' | 'error';

export type AdminMutationResult<T> = {
  status: AdminMutationStatus;
  error: string | null;
  data: T | null;
  mutate: (action: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
};

export function useAdminMutation<T>(): AdminMutationResult<T> {
  const [status, setStatus] = useState<AdminMutationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setData(null);
  }, []);

  const mutate = useCallback(async (action: () => Promise<T>) => {
    setStatus('pending');
    setError(null);
    try {
      const result = await action();
      setData(result);
      setStatus('success');
      return result;
    } catch (mutationError: unknown) {
      setError(apiErrorMessage(mutationError));
      setStatus('error');
      return null;
    }
  }, []);

  return { status, error, data, mutate, reset };
}
