'use client';

import { useCallback, useState } from 'react';

export type AdminActionFeedbackState = {
  message: string | null;
  error: string | null;
  setMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
  clear: () => void;
  clearForAction: () => void;
};

export function useAdminActionFeedback(): AdminActionFeedbackState {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  const clearForAction = useCallback(() => {
    clear();
  }, [clear]);

  return {
    message,
    error,
    setMessage,
    setError,
    clear,
    clearForAction,
  };
}
