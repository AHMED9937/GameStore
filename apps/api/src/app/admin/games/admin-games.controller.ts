import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { adminSetupResponse } from '../admin-setup';

const GAMES_SETUP = adminSetupResponse(
  'admin-games',
  'Admin games — not implemented yet',
);

@Roles('admin')
@Controller('admin/games')
export class AdminGamesController {
  @Get()
  findAll() {
    return GAMES_SETUP;
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return GAMES_SETUP;
  }

  @Post()
  create(@Body() _body: unknown) {
    return GAMES_SETUP;
  }

  @Put(':id')
  update(@Param('id') _id: string, @Body() _body: unknown) {
    return GAMES_SETUP;
  }

  @Delete(':id')
  remove(@Param('id') _id: string) {
    return GAMES_SETUP;
  }
}
