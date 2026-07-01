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
import {
  AdminGamesService,
  type AdminCreateGameDto,
  type AdminUpdateGameDto,
} from './admin-games.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/games')
export class AdminGamesController {
  constructor(
    private readonly adminGames: AdminGamesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll() {
    return this.adminGames.findAll();
  }

  @Get(':id/readiness')
  getReadiness(@Param('id') id: string) {
    return this.adminGames.getReadiness(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminGames.findOne(id);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: AdminCreateGameDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const game = await this.adminGames.create(body);
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.game.create',
      resource: 'game',
      resourceId: game.id,
      ip: audit.ip,
      userAgent: audit.userAgent,
      metadata: { slug: game.slug, title: game.title },
    });
    return game;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: AdminUpdateGameDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const game = await this.adminGames.update(id, body);
    const audit = auditContextFromRequest(request);
    const action =
      body.published === true
        ? 'admin.game.publish'
        : body.published === false
          ? 'admin.game.unpublish'
          : 'admin.game.update';

    recordAudit(this.auditLogService, {
      userId: user.id,
      action,
      resource: 'game',
      resourceId: game.id,
      ip: audit.ip,
      userAgent: audit.userAgent,
      metadata: {
        slug: game.slug,
        published: game.published,
      },
    });
    return game;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.adminGames.remove(id);
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.game.delete',
      resource: 'game',
      resourceId: id,
      ip: audit.ip,
      userAgent: audit.userAgent,
    });
    return result;
  }
}
