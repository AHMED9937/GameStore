import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';

export const THROTTLE_DEFAULTS = {
  ttlMs: 60_000,
  limitDefault: 100,
  limitGamesList: 60,
  limitLicenseValidate: 10,
  limitSteamGuard: 5,
  limitCheckout: 20,
} as const;

export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export type ThrottleEnv = {
  throttleTtlMs?: string;
  throttleLimitDefault?: string;
  throttleLimitGames?: string;
  throttleLimitLicenseValidate?: string;
  throttleLimitSteamGuard?: string;
  throttleLimitCheckout?: string;
};

export function buildThrottlerModuleOptions(
  env: ThrottleEnv = process.env as ThrottleEnv,
): ThrottlerModuleOptions {
  const ttl = parsePositiveInt(env.throttleTtlMs, THROTTLE_DEFAULTS.ttlMs);

  return {
    throttlers: [
      {
        name: 'default',
        ttl,
        limit: parsePositiveInt(
          env.throttleLimitDefault,
          THROTTLE_DEFAULTS.limitDefault,
        ),
      },
    ],
  };
}

export function throttleLimitGamesList(env: ThrottleEnv = process.env as ThrottleEnv) {
  return parsePositiveInt(env.throttleLimitGames, THROTTLE_DEFAULTS.limitGamesList);
}

export function throttleLimitLicenseValidate(
  env: ThrottleEnv = process.env as ThrottleEnv,
) {
  return parsePositiveInt(
    env.throttleLimitLicenseValidate,
    THROTTLE_DEFAULTS.limitLicenseValidate,
  );
}

export function throttleLimitSteamGuard(env: ThrottleEnv = process.env as ThrottleEnv) {
  return parsePositiveInt(
    env.throttleLimitSteamGuard,
    THROTTLE_DEFAULTS.limitSteamGuard,
  );
}

export function throttleLimitCheckout(env: ThrottleEnv = process.env as ThrottleEnv) {
  return parsePositiveInt(
    env.throttleLimitCheckout,
    THROTTLE_DEFAULTS.limitCheckout,
  );
}

export function throttleTtlMs(env: ThrottleEnv = process.env as ThrottleEnv) {
  return parsePositiveInt(env.throttleTtlMs, THROTTLE_DEFAULTS.ttlMs);
}

/** Global Nest throttling keys requests by client IP. */
export function ipThrottleTracker(req: Record<string, unknown>): string {
  const record = req as { ip?: string; ips?: string[] };
  return record.ip ?? record.ips?.[0] ?? 'unknown';
}

/** Steam guard codes are limited per signed-in user (falls back to IP). */
export function steamGuardThrottleTracker(
  req: Record<string, unknown>,
  _context: ExecutionContext,
): string {
  const record = req as { ip?: string; ips?: string[]; user?: { id?: string } };
  if (record.user?.id) {
    return `user:${record.user.id}`;
  }
  return `ip:${ipThrottleTracker(record)}`;
}

export function buildDefaultRouteThrottle(
  limit: number,
  env: ThrottleEnv = process.env as ThrottleEnv,
) {
  return {
    default: {
      limit,
      ttl: throttleTtlMs(env),
    },
  } as const;
}

export function buildSteamGuardThrottle(env: ThrottleEnv = process.env as ThrottleEnv) {
  return {
    default: {
      limit: throttleLimitSteamGuard(env),
      ttl: throttleTtlMs(env),
      getTracker: steamGuardThrottleTracker,
    },
  } as const;
}
