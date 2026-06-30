import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { adminSetupResponse } from '../admin-setup';

const LICENSES_SETUP = adminSetupResponse(
  'admin-licenses',
  'Admin licenses — not implemented yet',
);

@Roles('admin')
@Controller('admin/licenses')
export class AdminLicensesController {
  @Get()
  findAll() {
    return LICENSES_SETUP;
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return LICENSES_SETUP;
  }

  @Post()
  create(@Body() _body: unknown) {
    return LICENSES_SETUP;
  }

  @Post('generate-key')
  generateKey() {
    return LICENSES_SETUP;
  }

  @Post(':id/revoke')
  revoke(@Param('id') _id: string) {
    return LICENSES_SETUP;
  }
}
