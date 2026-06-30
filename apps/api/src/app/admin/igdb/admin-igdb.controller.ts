import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { IgdbService } from '@gamestore/api/igdb';

@Roles('admin')
@Controller('admin/igdb')
export class AdminIgdbController {
  constructor(private readonly igdb: IgdbService) {}

  @Get('search')
  search(@Query('q') query?: string) {
    return this.igdb.search(query?.trim() ?? '');
  }

  @Post('import')
  importGame(@Body() body: { igdbId?: number }) {
    return this.igdb.importGame(body.igdbId ?? 0);
  }
}
