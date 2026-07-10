import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AuditLogService,
  CurrentUser,
  Roles,
  auditContextFromRequest,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import { IgdbConfig, IgdbService } from '@gamestore/api/igdb';
import { buildDefaultRouteThrottle, throttleLimitIgdb } from '../../../security/throttle.config';
import { AdminIgdbImportService } from './admin-igdb-import.service';
import { parseImportIgdbBody } from './import-igdb.dto';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

function isImportedGameResponse(
  result: unknown,
): result is { game: { id: string; igdbId: number; slug: string } } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'game' in result &&
    typeof (result as { game?: { id?: unknown } }).game?.id === 'string'
  );
}

@Roles('admin')
@Controller('admin/igdb')
export class AdminIgdbController {
  constructor(
    private readonly igdb: IgdbService,
    private readonly igdbImport: AdminIgdbImportService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('health')
  health() {
    return {
      integration: IgdbConfig.integration,
      configured: IgdbConfig.isConfigured(),
    };
  }

  @Throttle(buildDefaultRouteThrottle(throttleLimitIgdb()))
  @Get('search')
  search(@Query('q') query?: string) {
    return this.igdb.search(query?.trim() ?? '');
  }

  @Throttle(buildDefaultRouteThrottle(throttleLimitIgdb()))
  @Get('preview/:igdbId')
  async preview(@Param('igdbId', ParseIntPipe) igdbId: number) {
    const result = await this.igdb.preview(igdbId);
    if (result && 'status' in result && result.status === 'setup') {
      return result;
    }
    if (!result) {
      throw new NotFoundException(`IGDB game ${igdbId} not found`);
    }
    return result;
  }

  @Throttle(buildDefaultRouteThrottle(throttleLimitIgdb()))
  @Post('import')
  async importGame(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const parsed = parseImportIgdbBody(body as Parameters<typeof parseImportIgdbBody>[0]);
    const result = await this.igdbImport.importGame(parsed);

    if (isImportedGameResponse(result)) {
      const audit = auditContextFromRequest(request);
      recordAudit(this.auditLogService, {
        userId: user.id,
        action: 'admin.igdb.import',
        resource: 'game',
        resourceId: result.game.id,
        ip: audit.ip,
        userAgent: audit.userAgent,
        metadata: {
          igdbId: result.game.igdbId,
          slug: result.game.slug,
          updated: 'updated' in result ? result.updated : false,
        },
      });
    }

    return result;
  }
}
