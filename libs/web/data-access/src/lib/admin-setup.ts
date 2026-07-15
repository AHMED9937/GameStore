import { ApiError } from './api-client';
import type { SetupResponse } from './admin.types';

const TRANSIENT_HTTP_STATUSES = new Set([502, 503, 504]);

/**
 * Prefer typing admin API results as `SetupResponse | T` (not `{ message: string }`).
 * Only then does a failed `isSetupResponse` check narrow the value to `T`.
 */
export function isSetupResponse(value: unknown): value is SetupResponse {
  return (
    !!value &&
    typeof value === 'object' &&
    'status' in value &&
    (value as SetupResponse).status === 'setup' &&
    typeof (value as SetupResponse).message === 'string'
  );
}

/** Discriminated unwrap so callers never assign a setup payload into domain state. */
export function readAdminResult<T>(
  result: SetupResponse | T,
): { ok: true; data: T } | { ok: false; message: string } {
  if (isSetupResponse(result)) {
    return { ok: false, message: result.message };
  }
  return { ok: true, data: result };
}

export function isTransientApiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return TRANSIENT_HTTP_STATUSES.has(error.status);
  }

  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && /aborted/i.test(error.message))
  );
}

function parseApiErrorBody(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }
    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    // Plain-text error body.
  }

  const trimmed = body.trim();
  if (!trimmed || trimmed === '{}') {
    return null;
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return null;
  }
  return trimmed;
}

export function apiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Sign in required';
    }
    if (error.status === 403) {
      try {
        const parsed = JSON.parse(error.body) as { message?: string };
        if (typeof parsed.message === 'string' && parsed.message.trim()) {
          return parsed.message;
        }
      } catch {
        // Plain-text error body.
      }
      return 'Admin access required';
    }
    if (error.status === 503 || error.status === 502 || error.status === 504) {
      return (
        parseApiErrorBody(error.body) ??
        'Server is busy or unavailable. Try again in a moment.'
      );
    }

    const parsed = parseApiErrorBody(error.body);
    if (parsed) {
      return parsed;
    }

    return fallback;
  }

  if (isTransientApiError(error)) {
    return 'Request timed out. Try again.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
