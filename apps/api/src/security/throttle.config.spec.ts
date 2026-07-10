import { describe, expect, it } from 'vitest';
import {
  buildDefaultRouteThrottle,
  buildThrottlerModuleOptions,
  ipThrottleTracker,
  parsePositiveInt,
  steamGuardThrottleTracker,
  throttleLimitIgdb,
  THROTTLE_DEFAULTS,
} from './throttle.config';

describe('throttle.config', () => {
  it('parsePositiveInt falls back for invalid values', () => {
    expect(parsePositiveInt(undefined, 10)).toBe(10);
    expect(parsePositiveInt('0', 10)).toBe(10);
    expect(parsePositiveInt('abc', 10)).toBe(10);
    expect(parsePositiveInt('25', 10)).toBe(25);
  });

  it('buildThrottlerModuleOptions reads env overrides', () => {
    expect(
      buildThrottlerModuleOptions({
        throttleTtlMs: '30000',
        throttleLimitDefault: '50',
      }),
    ).toEqual({
      throttlers: [{ name: 'default', ttl: 30_000, limit: 50 }],
    });
  });

  it('uses documented defaults when env is unset', () => {
    expect(buildThrottlerModuleOptions({})).toEqual({
      throttlers: [
        {
          name: 'default',
          ttl: THROTTLE_DEFAULTS.ttlMs,
          limit: THROTTLE_DEFAULTS.limitDefault,
        },
      ],
    });
  });

  it('ipThrottleTracker prefers req.ip', () => {
    expect(ipThrottleTracker({ ip: '203.0.113.1' })).toBe('203.0.113.1');
    expect(ipThrottleTracker({ ips: ['198.51.100.2'] })).toBe('198.51.100.2');
  });

  it('steamGuardThrottleTracker prefers authenticated user id', () => {
    expect(
      steamGuardThrottleTracker(
        { ip: '203.0.113.1', user: { id: 'user-1' } },
        {} as never,
      ),
    ).toBe('user:user-1');
    expect(steamGuardThrottleTracker({ ip: '203.0.113.1' }, {} as never)).toBe(
      'ip:203.0.113.1',
    );
  });

  it('buildDefaultRouteThrottle applies per-route limits', () => {
    expect(
      buildDefaultRouteThrottle(10, { throttleTtlMs: '60000' }).default.limit,
    ).toBe(10);
  });

  it('throttleLimitIgdb reads env override', () => {
    expect(throttleLimitIgdb({ throttleLimitIgdb: '5' })).toBe(5);
    expect(throttleLimitIgdb({})).toBe(THROTTLE_DEFAULTS.limitIgdb);
  });
});
