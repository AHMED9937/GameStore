import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import {
  CreateGameAccountDto,
  GameAccountsService,
} from './game-accounts.service';

@Roles('admin')
@Controller('game-accounts')
export class GameAccountsController {
  constructor(private readonly accounts: GameAccountsService) {}

  @Get()
  findAll(@Query('gameId') gameId?: string) {
    return this.accounts.findAll(gameId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accounts.findOne(id);
  }

  @Post()
  create(@Body() body: CreateGameAccountDto) {
    return this.accounts.create(body);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.accounts.deactivate(id);
  }
}
