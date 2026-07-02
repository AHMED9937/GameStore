import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
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
import {
  AdminSubscriptionPlansService,
  type CreateAdminSubscriptionPlanDto,
  type UpdateAdminSubscriptionPlanDto,
} from './admin-subscription-plans.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/subscription-plans')
export class AdminSubscriptionPlansController {
  constructor(
    private readonly plans: AdminSubscriptionPlansService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll() {
    return this.plans.findAll();
  }

  @Post('bulk-delete')
  @HttpCode(200)
  async bulkDelete(
    @Body() body: BulkIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.plans.bulkDelete(body.ids);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.subscription_plan.bulk_delete',
      resource: 'subscription_plan',
      resourceId: null,
      metadata: {
        ids: body.ids,
        succeeded: result.succeeded,
        failed: result.failed,
      },
    });
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plans.findOne(id);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: CreateAdminSubscriptionPlanDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const plan = await this.plans.create(body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.subscription_plan.create',
      resource: 'subscription_plan',
      resourceId: plan.id,
      metadata: { slug: plan.slug, gameCount: plan.games.length },
    });
    return plan;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAdminSubscriptionPlanDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const plan = await this.plans.update(id, body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.subscription_plan.update',
      resource: 'subscription_plan',
      resourceId: id,
      metadata: {
        slug: plan.slug,
        gameCount: plan.games.length,
        fieldsChanged: Object.keys(body),
      },
    });
    return plan;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.plans.remove(id);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.subscription_plan.delete',
      resource: 'subscription_plan',
      resourceId: id,
    });
    return result;
  }
}
