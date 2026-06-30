import { Logger } from '@nestjs/common';
import type { AuditLogInput } from './audit-log';
import type { AuditLogService } from './audit-log.service';

const logger = new Logger('AuditLog');

export function recordAudit(
  auditLogService: AuditLogService,
  input: AuditLogInput,
): void {
  void auditLogService.log(input).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to write audit log (${input.action}): ${message}`);
  });
}
