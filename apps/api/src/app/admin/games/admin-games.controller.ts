import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
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
import { AdminIgdbImportService } from '../igdb/admin-igdb-import.service';
import {
  AdminGamesService,
  type AdminCreateGameDto,
  type AdminUpdateGameDto,
} from './admin-games.service';
import { AdminGameDiscountService } from './admin-game-discount.service';
import { FeaturedGameIdsDto } from './featured-game-ids.dto';
import type { AdminGameListFiltersDto } from './admin-game-list-filters.dto';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/games')
export class AdminGamesController {
  constructor(
    private readonly adminGames: AdminGamesService,
    private readonly auditLogService: AuditLogService,
    private readonly igdbImport: AdminIgdbImportService,
    private readonly gameDiscounts: AdminGameDiscountService,
  ) {}

  @Get()
  findAll(@Query() filters: AdminGameListFiltersDto) {
    return this.adminGames.findAll(filters);
  }

  @Post('bulk-unpublish')
  @HttpCode(200)
  async bulkUnpublish(
    @Body() body: BulkIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.adminGames.bulkUnpublish(body.ids);
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.game.bulk_unpublish',
      resource: 'game',
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

  @Post('bulk-delete')
  @HttpCode(200)
  async bulkDelete(
    @Body() body: BulkIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.adminGames.bulkDelete(body.ids);
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.game.bulk_delete',
      resource: 'game',
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

  @Get('featured')
  getFeatured(@Query('q') q?: string) {
    return this.adminGames.getFeaturedGames(q);
  }

  @Put('featured')
  async updateFeatured(
    @Body() body: FeaturedGameIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.adminGames.updateFeaturedGames(body.gameIds);
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.game.featured_update',
      resource: 'game',
      resourceId: null,
      ip: audit.ip,
      userAgent: audit.userAgent,
      metadata: { gameIds: body.gameIds },
    });
    return result;
  }

  @Get(':id/readiness')
  getReadiness(@Param('id') id: string) {
    return this.adminGames.getReadiness(id);
  }

  @Put(':id/discount')
  async upsertDiscount(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const discount = await this.gameDiscounts.upsertDiscount(id, body ?? {});
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.game.discount_upsert',
      resource: 'game',
      resourceId: id,
      ip: audit.ip,
      userAgent: audit.userAgent,
      metadata: {
        percentOff: discount.percentOff,
        endsAt: discount.endsAt,
        enabled: discount.enabled,
      },
    });
    return discount;
  }

  @Delete(':id/discount')
  async endDiscount(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.gameDiscounts.endDiscount(id);
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.game.discount_end',
      resource: 'game',
      resourceId: id,
      ip: audit.ip,
      userAgent: audit.userAgent,
    });
    return result;
  }

  @Patch(':id/next-account')
  async setNextAccount(
    @Param('id') id: string,
    @Body() body: { accountId: string | null },
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const game = await this.adminGames.setNextAccount(
      id,
      body?.accountId ?? null,
    );
    const audit = auditContextFromRequest(request);
    recordAudit(this.auditLogService, {
      userId: user.id,
      action: 'admin.game.next_account',
      resource: 'game',
      resourceId: game.id,
      ip: audit.ip,
      userAgent: audit.userAgent,
      metadata: { nextAccountId: game.nextAccountId },
    });
    return game;
  }

  @Post(':id/sync-igdb')
  @HttpCode(200)
  async syncFromIgdb(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.igdbImport.syncGame(id);

    if (
      typeof result === 'object' &&
      result !== null &&
      'game' in result &&
      typeof (result as { game?: { id?: unknown } }).game?.id === 'string'
    ) {
      const game = (result as { game: { id: string; igdbId: number; slug: string } }).game;
      const audit = auditContextFromRequest(request);
      recordAudit(this.auditLogService, {
        userId: user.id,
        action: 'admin.igdb.resync',
        resource: 'game',
        resourceId: game.id,
        ip: audit.ip,
        userAgent: audit.userAgent,
        metadata: {
          igdbId: game.igdbId,
          slug: game.slug,
        },
      });
    }

    return result;
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
          : body.soldOut === true
            ? 'admin.game.sold_out'
            : body.soldOut === false
              ? 'admin.game.available'
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
