import { ApiError } from './api-client';
import type { SetupResponse } from './admin.types';

export function isSetupResponse(value: unknown): value is SetupResponse {
  return (
    !!value &&
    typeof value === 'object' &&
    'status' in value &&
    (value as SetupResponse).status === 'setup' &&
    typeof (value as SetupResponse).message === 'string'
  );
}

export function apiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Sign in required';
    }
    if (error.status === 403) {
      return 'Admin access required';
    }
    try {
      const body = JSON.parse(error.body) as { message?: string };
      if (body.message) {
        return body.message;
      }
    } catch {
      // Plain-text error body.
    }
    return error.body || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
