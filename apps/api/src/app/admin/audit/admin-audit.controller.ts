import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { AdminAuditService } from './admin-audit.service';
import type { AdminAuditListFiltersDto } from './admin-audit-list-filters.dto';

@Roles('admin')
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly audit: AdminAuditService) {}

  @Get()
  list(@Query() filters: AdminAuditListFiltersDto) {
    return this.audit.list(filters);
  }
}
