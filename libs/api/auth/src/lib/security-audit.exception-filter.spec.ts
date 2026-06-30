import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from './audit-log.service';
import { SecurityAuditExceptionFilter } from './security-audit.exception-filter';

describe('SecurityAuditExceptionFilter', () => {
  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditLogService;

  let filter: SecurityAuditExceptionFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new SecurityAuditExceptionFilter(auditLogService);
  });

  it('records auth.forbidden for 403 responses', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    filter.catch(new ForbiddenException('Insufficient permissions'), {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/api/games',
          route: { path: '/games' },
          ip: '203.0.113.1',
          headers: { 'user-agent': 'vitest' },
          user: { id: 'user-1', role: 'user' },
        }),
        getResponse: () => ({ status }),
      }),
    } as never);

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.forbidden',
        userId: 'user-1',
      }),
    );
    expect(status).toHaveBeenCalledWith(403);
  });

  it('records auth.login_failed for invalid JWT messages', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    filter.catch(new UnauthorizedException('Invalid or expired token'), {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/api/licenses/mine',
          route: { path: '/licenses/mine' },
          ip: '203.0.113.1',
          headers: {},
        }),
        getResponse: () => ({ status }),
      }),
    } as never);

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login_failed',
      }),
    );
  });
});
