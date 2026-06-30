import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { AuditLogsService } from './audit-logs.service';

@Roles('admin')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.auditLogs.list({
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      action: action?.trim() || undefined,
    });
  }
}
