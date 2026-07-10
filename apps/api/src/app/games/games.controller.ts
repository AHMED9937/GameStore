import { Body, Controller, Delete, Get, Header, Param, Post, Put, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AuditLogService,
  CurrentUser,
  Public,
  Roles,
  auditContextFromRequest,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import {
  buildDefaultRouteThrottle,
  throttleLimitGamesList,
} from '../../security/throttle.config';
import {
  CreateGameDto,
  GamesService,
} from './games.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

const PUBLIC_GAMES_CACHE_CONTROL =
  'public, max-age=60, stale-while-revalidate=300';

@Controller('games')
export class GamesController {
  constructor(
    private readonly games: GamesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @Header('Cache-Control', PUBLIC_GAMES_CACHE_CONTROL)
  @Throttle(buildDefaultRouteThrottle(throttleLimitGamesList()))
  @Get()
  findAll() {
    return this.games.findAll();
  }

  @Public()
  @Header('Cache-Control', PUBLIC_GAMES_CACHE_CONTROL)
  @Throttle(buildDefaultRouteThrottle(throttleLimitGamesList()))
  @Get('featured')
  findFeatured() {
    return this.games.findFeatured(5);
  }

  @Public()
  @Header('Cache-Control', PUBLIC_GAMES_CACHE_CONTROL)
  @Throttle(buildDefaultRouteThrottle(throttleLimitGamesList()))
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.games.findBySlug(slug);
  }

  @Roles('admin')
  @Post()
  async create(
    @Body() body: CreateGameDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const game = await this.games.create(body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.game.create',
      resource: 'game',
      resourceId: game.id,
      metadata: { slug: game.slug, title: game.title },
    });
    return game;
  }

  @Roles('admin')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<CreateGameDto>,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const game = await this.games.update(id, body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.game.update',
      resource: 'game',
      resourceId: game.id,
      metadata: { slug: game.slug },
    });
    return game;
  }

  @Roles('admin')
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.games.remove(id);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.game.delete',
      resource: 'game',
      resourceId: id,
    });
    return result;
  }
}
