import type { AuthUser } from './auth.types';
import type { AuditLogInput } from './audit-log';

export type AuditRequest = {
  ip?: string;
  ips?: string[];
  headers?: { 'user-agent'?: string };
  user?: AuthUser;
  method?: string;
  url?: string;
  route?: { path?: string };
};

export function auditContextFromRequest(
  request: AuditRequest,
): Pick<AuditLogInput, 'userId' | 'ip' | 'userAgent'> {
  return {
    userId: request.user?.id ?? null,
    ip: request.ip ?? request.ips?.[0] ?? null,
    userAgent: request.headers?.['user-agent'] ?? null,
  };
}

export function auditResourcePath(request: AuditRequest): string {
  return request.route?.path ?? request.url ?? 'unknown';
}
