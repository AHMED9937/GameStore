import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import {
  AuditLogService,
  CurrentUser,
  Roles,
  auditContextFromRequest,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import { IgdbService } from '@gamestore/api/igdb';
import { AdminIgdbImportService } from './admin-igdb-import.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

type ImportIgdbBody = {
  igdbId?: number;
  priceBase?: number | string;
  platform?: string;
  slug?: string;
};

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

  @Get('search')
  search(@Query('q') query?: string) {
    return this.igdb.search(query?.trim() ?? '');
  }

  @Post('import')
  async importGame(
    @Body() body: ImportIgdbBody,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.igdbImport.importGame({
      igdbId: body.igdbId ?? 0,
      priceBase: body.priceBase ?? 9.99,
      platform: body.platform ?? 'steam',
      slug: body.slug,
    });

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
        },
      });
    }

    return result;
  }
}
