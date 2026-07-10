import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { buildForwardHeaders } from './proxy-headers';

const API_BASE = process.env['API_URL'] ?? 'http://localhost:3333';
const DEFAULT_UPSTREAM_TIMEOUT_MS = 15_000;
const SLOW_UPSTREAM_TIMEOUT_MS = 20_000;
const PUBLIC_GAMES_CACHE_CONTROL =
  'public, s-maxage=60, stale-while-revalidate=300';

function isSelfProxy(request: NextRequest, target: URL): boolean {
  const { hostname, port, protocol } = request.nextUrl;
  const sameHost =
    target.hostname === hostname ||
    (target.hostname === 'localhost' && hostname === '127.0.0.1') ||
    (target.hostname === '127.0.0.1' && hostname === 'localhost');
  const targetPort = target.port || (target.protocol === 'https:' ? '443' : '80');
  const requestPort = port || (protocol === 'https:' ? '443' : '80');
  return sameHost && targetPort === requestPort;
}

function upstreamTimeoutMs(pathname: string, method: string): number {
  if (pathname.startsWith('orders/by-session/')) {
    return SLOW_UPSTREAM_TIMEOUT_MS;
  }
  if (method === 'POST' && pathname === 'payments/checkout') {
    return SLOW_UPSTREAM_TIMEOUT_MS;
  }
  if (pathname.startsWith('admin/')) {
    return SLOW_UPSTREAM_TIMEOUT_MS;
  }
  return DEFAULT_UPSTREAM_TIMEOUT_MS;
}

const UPSTREAM_UNAVAILABLE_MESSAGE =
  'API is starting or temporarily unreachable. If Nest is running (pnpm nx serve api), wait a moment and retry.';

function upstreamErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Upstream API request timed out. The server may still be processing your order try again in a moment.';
  }

  const code =
    error instanceof Error && 'cause' in error
      ? (error.cause as NodeJS.ErrnoException | undefined)?.code
      : undefined;

  if (process.env['NODE_ENV'] === 'development' && code) {
    console.warn(`[BFF] Upstream fetch failed (${code})`, error);
  }

  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
    return UPSTREAM_UNAVAILABLE_MESSAGE;
  }

  return UPSTREAM_UNAVAILABLE_MESSAGE;
}

function isPublicGamesGet(pathname: string, method: string): boolean {
  if (method !== 'GET') {
    return false;
  }

  return (
    pathname === 'games' ||
    pathname === 'games/featured' ||
    /^games\/[^/]+$/.test(pathname)
  );
}

function shouldRevalidateGamesCatalog(pathname: string, method: string): boolean {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return false;
  }

  return (
    pathname === 'admin/games' ||
    pathname.startsWith('admin/games/') ||
    pathname === 'admin/igdb/import' ||
    pathname.startsWith('admin/igdb/')
  );
}

function extractGameSlugFromAdminMutation(
  body: string,
): string | null {
  if (!body.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as { slug?: string; game?: { slug?: string } };
    return parsed.slug?.trim() || parsed.game?.slug?.trim() || null;
  } catch {
    return null;
  }
}

async function fetchUpstream(
  target: URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(target, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const pathname = pathSegments.join('/');
  const target = new URL(`/api/${pathname}`, API_BASE);
  target.search = request.nextUrl.search;

  if (isSelfProxy(request, target)) {
    return NextResponse.json(
      {
        error: 'BFF misconfiguration: API_URL must point to NestJS, not the Next.js server.',
      },
      { status: 502 },
    );
  }

  const headers = buildForwardHeaders(request.headers);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: isPublicGamesGet(pathname, request.method) ? 'default' : 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const upstream = await fetchUpstream(
      target,
      init,
      upstreamTimeoutMs(pathname, request.method),
    );
    const body = await upstream.text();

    if (shouldRevalidateGamesCatalog(pathname, request.method) && upstream.ok) {
      revalidateTag('games');
      const slug = extractGameSlugFromAdminMutation(body);
      if (slug) {
        revalidateTag(`game:${slug}`);
      }
    }

    const responseHeaders: Record<string, string> = {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    };

    if (isPublicGamesGet(pathname, request.method)) {
      responseHeaders['cache-control'] =
        upstream.headers.get('cache-control') ?? PUBLIC_GAMES_CACHE_CONTROL;
    }

    return new NextResponse(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: upstreamErrorMessage(error) },
      { status: 503 },
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
