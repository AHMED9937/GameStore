import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  AuditLogService,
  CurrentUser,
  Roles,
  auditContextFromRequest,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import { BulkIdsDto } from '../dto/bulk-ids.dto';
import { AdminOrdersService } from './admin-orders.service';
import type { AdminOrderListFiltersDto } from './admin-order-list-filters.dto';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly adminOrders: AdminOrdersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll(@Query() filters: AdminOrderListFiltersDto) {
    return this.adminOrders.findAll(filters);
  }

  @Post('bulk-delete')
  @HttpCode(200)
  async bulkDelete(
    @Body() body: BulkIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.adminOrders.bulkDelete(body.ids);
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.order.bulk_delete',
      resource: 'order',
      resourceId: null,
      ip: audit.ip,
      userAgent: audit.userAgent,
      metadata: {
        ids: body.ids,
        succeeded: result.succeeded,
        failed: result.failed,
      },
    });
    return result;
  }
}
