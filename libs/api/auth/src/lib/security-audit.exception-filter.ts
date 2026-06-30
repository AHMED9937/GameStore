import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { auditContextFromRequest, auditResourcePath } from './audit-context';
import { recordAudit } from './audit-record';
import { AuditLogService } from './audit-log.service';

@Catch(UnauthorizedException, ForbiddenException)
export class SecurityAuditExceptionFilter implements ExceptionFilter {
  constructor(private readonly auditLogService: AuditLogService) {}

  catch(
    exception: UnauthorizedException | ForbiddenException,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const status = exception.getStatus();
    const message = exception.message;

    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      action: this.resolveAction(status, message),
      resource: 'http',
      resourceId: auditResourcePath(request),
      metadata: {
        status,
        method: request.method,
        path: request.url,
        message,
      },
    });

    const body = exception.getResponse();
    response.status(status).json(body);
  }

  private resolveAction(status: number, message: string): string {
    if (status === 403) {
      return 'auth.forbidden';
    }

    if (/invalid or expired token/i.test(message)) {
      return 'auth.login_failed';
    }

    return 'auth.unauthorized';
  }
}
