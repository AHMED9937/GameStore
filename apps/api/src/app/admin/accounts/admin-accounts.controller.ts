import {
  Body,
  Controller,
  Delete,
  Get,
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
import {
  AdminAccountsService,
  type CreateAdminAccountDto,
  type UpdateAdminAccountDto,
} from './admin-accounts.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(
    private readonly accounts: AdminAccountsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll(@Query('gameId') gameId?: string) {
    return this.accounts.findAll(gameId);
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
      metadata: { gameId: body.gameId, username: body.username },
    });
    return account;
  }

  @Post(':id/deactivate')
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const account = await this.accounts.deactivate(id);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.account.deactivate',
      resource: 'game_account',
      resourceId: id,
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
