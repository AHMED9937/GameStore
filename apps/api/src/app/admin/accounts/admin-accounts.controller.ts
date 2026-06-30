import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { adminSetupResponse } from '../admin-setup';

const ACCOUNTS_SETUP = adminSetupResponse(
  'admin-accounts',
  'Admin accounts — not implemented yet',
);

@Roles('admin')
@Controller('admin/accounts')
export class AdminAccountsController {
  @Get()
  findAll() {
    return ACCOUNTS_SETUP;
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return ACCOUNTS_SETUP;
  }

  @Post()
  create(@Body() _body: unknown) {
    return ACCOUNTS_SETUP;
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') _id: string) {
    return ACCOUNTS_SETUP;
  }
}
