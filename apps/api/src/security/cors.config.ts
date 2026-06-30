import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEV_DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4200',
] as const;

export function parseCorsOrigins(
  value: string | undefined,
  nodeEnv = process.env['NODE_ENV'],
): string[] {
  const parsed = value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (parsed && parsed.length > 0) {
    return parsed;
  }

  if (nodeEnv === 'production') {
    return [];
  }

  return [...DEV_DEFAULT_ORIGINS];
}

export function buildCorsOptions(env: {
  corsOrigins?: string;
  nodeEnv?: string;
}): CorsOptions {
  const allowedOrigins = parseCorsOrigins(env.corsOrigins, env.nodeEnv);

  return {
    origin: (origin, callback) => {
      // Server-to-server / curl / same-origin requests may omit Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  };
}
