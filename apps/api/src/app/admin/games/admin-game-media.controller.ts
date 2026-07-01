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
  AdminGameMediaService,
  type CreateGameMediaDto,
  type UpdateGameMediaDto,
} from './admin-game-media.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/games/:gameId/media')
export class AdminGameMediaController {
  constructor(
    private readonly media: AdminGameMediaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  list(@Param('gameId') gameId: string) {
    return this.media.list(gameId);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Param('gameId') gameId: string,
    @Body() body: CreateGameMediaDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const row = await this.media.create(gameId, body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.game.media.create',
      resource: 'game_media',
      resourceId: row.id,
      metadata: { gameId, type: row.type },
    });
    return row;
  }

  @Put(':mediaId')
  async update(
    @Param('gameId') gameId: string,
    @Param('mediaId') mediaId: string,
    @Body() body: UpdateGameMediaDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const row = await this.media.update(gameId, mediaId, body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.game.media.update',
      resource: 'game_media',
      resourceId: mediaId,
      metadata: { gameId },
    });
    return row;
  }

  @Delete(':mediaId')
  async remove(
    @Param('gameId') gameId: string,
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.media.remove(gameId, mediaId);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.game.media.delete',
      resource: 'game_media',
      resourceId: mediaId,
      metadata: { gameId },
    });
    return result;
  }
}
