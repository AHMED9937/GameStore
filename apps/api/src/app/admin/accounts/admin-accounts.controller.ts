import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
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
import {
  AdminAccountsService,
  type AssignAdminAccountDto,
  type CreateAdminAccountDto,
  type DeactivateAdminAccountDto,
  type UnassignAdminAccountDto,
  type UpdateAdminAccountDto,
} from './admin-accounts.service';
import type { AdminAccountListFiltersDto } from './admin-account-list-filters.dto';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(
    private readonly accounts: AdminAccountsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll(@Query() filters: AdminAccountListFiltersDto) {
    return this.accounts.findAll(filters);
  }

  @Get('available')
  findAvailable(@Query('q') query?: string) {
    return this.accounts.findAvailable(query);
  }

  @Post('bulk-deactivate')
  @HttpCode(200)
  async bulkDeactivate(
    @Body() body: BulkIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.accounts.bulkDeactivate(body.ids);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.bulk_deactivate',
      resource: 'game_account',
      resourceId: null,
      metadata: {
        ids: body.ids,
        succeeded: result.succeeded,
        failed: result.failed,
      },
    });
    return result;
  }

  @Post('bulk-delete')
  @HttpCode(200)
  async bulkDelete(
    @Body() body: BulkIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.accounts.bulkDelete(body.ids);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.bulk_delete',
      resource: 'game_account',
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
    return this.accounts.findOne(id);
  }

  @Post()
  async create(
    @Body() body: CreateAdminAccountDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const account = await this.accounts.create(body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.create',
      resource: 'game_account',
      resourceId: account.id,
      metadata: { gameId: body.gameId ?? null, username: body.username },
    });
    return account;
  }

  @Post(':id/assign')
  @HttpCode(200)
  async assign(
    @Param('id') id: string,
    @Body() body: AssignAdminAccountDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const account = await this.accounts.assignToGame(id, body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.assign',
      resource: 'game_account',
      resourceId: id,
      metadata: { gameId: body.gameId, username: account.username },
    });
    return account;
  }

  @Post(':id/unassign')
  @HttpCode(200)
  async unassign(
    @Param('id') id: string,
    @Body() body: UnassignAdminAccountDto = {},
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const before = await this.accounts.findOne(id);
    const account = await this.accounts.unassignFromGame(id, body ?? {});
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.unassign',
      resource: 'game_account',
      resourceId: id,
      metadata: {
        username: account.username,
        targetAccountId: body?.targetAccountId ?? null,
        occupiedSeats: before.activeUsersCount,
      },
    });
    return account;
  }

  @Post(':id/clear-guard-lock')
  @HttpCode(200)
  async clearGuardLock(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const account = await this.accounts.clearGuardLock(id);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.clear_guard_lock',
      resource: 'game_account',
      resourceId: id,
      metadata: { username: account.username },
    });
    return account;
  }

  @Post(':id/deactivate')
  async deactivate(
    @Param('id') id: string,
    @Body() body: DeactivateAdminAccountDto = {},
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const before = await this.accounts.findOne(id);
    const account = await this.accounts.deactivate(id, body ?? {});
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.deactivate',
      resource: 'game_account',
      resourceId: id,
      metadata: {
        username: account.username,
        targetAccountId: body?.targetAccountId ?? null,
        occupiedSeats: before.activeUsersCount,
        unassigned: true,
      },
    });
    return account;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAdminAccountDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const account = await this.accounts.update(id, body);
    const fieldsChanged = Object.keys(body).filter(
      (key) => body[key as keyof UpdateAdminAccountDto] !== undefined,
    );
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.update',
      resource: 'game_account',
      resourceId: id,
      metadata: { username: account.username, fieldsChanged },
    });
    return account;
  }

  @Post(':id/reactivate')
  async reactivate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const account = await this.accounts.reactivate(id);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.reactivate',
      resource: 'game_account',
      resourceId: id,
      metadata: { username: account.username },
    });
    return account;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.accounts.remove(id);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.delete',
      resource: 'game_account',
      resourceId: id,
    });
    return result;
  }
}
