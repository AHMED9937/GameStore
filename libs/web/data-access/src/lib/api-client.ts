/// <reference path="./clerk-window.d.ts" />

export class ApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`API ${status}: ${body}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const TRANSIENT_HTTP_STATUSES = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [300, 800];

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  // Server: call Nest directly never default to Next's own port (3000)
  const apiUrl = process.env['API_URL'] ?? 'http://localhost:3333';
  return `${apiUrl}/api`;
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export type ApiAuthOptions = {
  getAuthToken?: () => Promise<string | null>;
};

export type ApiPublicCacheOptions = {
  revalidate?: number;
  tags?: readonly string[];
};

type NextAwareRequestInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

/** Attach Clerk session JWT on browser requests (Slice S.3). */
async function resolveAuthHeaders(
  auth?: ApiAuthOptions,
): Promise<Record<string, string>> {
  if (auth?.getAuthToken) {
    try {
      const token = await auth.getAuthToken();
      if (!token) {
        return {};
      }
      return { Authorization: `Bearer ${token}` };
    } catch {
      return {};
    }
  }

  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const token = await window.Clerk?.session?.getToken();
    if (!token) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown, status?: number): boolean {
  if (status !== undefined && TRANSIENT_HTTP_STATUSES.has(status)) {
    return true;
  }

  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && /aborted/i.test(error.message))
  );
}

async function fetchWithTimeout(
  input: string,
  init?: RequestInit,
  timeoutMs = 15_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  timeoutMs = 15_000,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetchWithTimeout(input, init, timeoutMs);
      if (
        !res.ok &&
        isRetryableError(null, res.status) &&
        attempt < RETRY_DELAYS_MS.length
      ) {
        await res.text();
        await sleep(RETRY_DELAYS_MS[attempt] ?? 0);
        continue;
      }
      return res;
    } catch (error) {
      lastError = error;
      if (isRetryableError(error) && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 0);
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error('Request failed after retries');
}

async function apiFetch(
  path: string,
  init: NextAwareRequestInit,
  auth?: ApiAuthOptions,
): Promise<Response> {
  const authHeaders = await resolveAuthHeaders(auth);
  return fetchWithRetry(`${getBaseUrl()}${normalizePath(path)}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...authHeaders,
      ...init.headers,
    },
  });
}

export async function apiGet<T>(
  path: string,
  init?: NextAwareRequestInit,
  auth?: ApiAuthOptions,
): Promise<T> {
  const res = await apiFetch(path, { ...init, method: 'GET' }, auth);
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return parseJson<T>(res);
}

/** Server-side public GET with Next.js ISR cache tags (no-op in the browser). */
export async function apiGetPublic<T>(
  path: string,
  cache?: ApiPublicCacheOptions,
  init?: NextAwareRequestInit,
): Promise<T> {
  const fetchInit: NextAwareRequestInit =
    typeof window === 'undefined' && cache
      ? {
          ...init,
          next: {
            revalidate: cache.revalidate,
            tags: cache.tags ? [...cache.tags] : undefined,
          },
        }
      : { ...init };

  return apiGet<T>(path, fetchInit);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return parseJson<T>(res);
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return parseJson<T>(res);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return parseJson<T>(res);
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, { ...init, method: 'DELETE' });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return parseJson<T>(res);
}
