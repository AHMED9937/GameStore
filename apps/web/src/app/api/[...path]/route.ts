import { NextRequest, NextResponse } from 'next/server';
import { buildForwardHeaders } from './proxy-headers';

const API_BASE = process.env['API_URL'] ?? 'http://localhost:3333';
const UPSTREAM_TIMEOUT_MS = 3_000;

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

async function fetchUpstream(target: URL, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
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
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const upstream = await fetchUpstream(target, init);
    const body = await upstream.text();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Upstream API unavailable. Start Nest with: pnpm nx dev api' },
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
