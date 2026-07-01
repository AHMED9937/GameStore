import {
  Body,
  Controller,
  Get,
  Param,
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
import {
  AdminAccountsService,
  type CreateAdminAccountDto,
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
}
