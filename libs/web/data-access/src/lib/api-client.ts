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

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  // Server: call Nest directly — never default to Next's own port (3000)
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

/** Attach Clerk session JWT on browser requests (Slice S.3). */
async function resolveAuthHeaders(): Promise<Record<string, string>> {
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

async function fetchWithTimeout(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 800);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = await resolveAuthHeaders();
  const res = await fetchWithTimeout(`${getBaseUrl()}${normalizePath(path)}`, {
    ...init,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...authHeaders,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return parseJson<T>(res);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const authHeaders = await resolveAuthHeaders();
  const res = await fetchWithTimeout(`${getBaseUrl()}${normalizePath(path)}`, {
    ...init,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders,
      ...init?.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return parseJson<T>(res);
}
