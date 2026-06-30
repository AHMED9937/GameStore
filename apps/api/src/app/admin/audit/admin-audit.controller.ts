import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { adminSetupResponse } from '../admin-setup';

const AUDIT_SETUP = adminSetupResponse(
  'admin-audit',
  'Admin audit log — not implemented yet',
);

@Roles('admin')
@Controller('admin/audit-logs')
export class AdminAuditController {
  @Get()
  list(
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('action') _action?: string,
  ) {
    return AUDIT_SETUP;
  }
}
