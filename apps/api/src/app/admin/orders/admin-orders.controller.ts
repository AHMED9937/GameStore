import { Controller, Get } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { adminSetupResponse } from '../admin-setup';

const ORDERS_SETUP = adminSetupResponse(
  'admin-orders',
  'Admin orders — not implemented yet',
);

@Roles('admin')
@Controller('admin/orders')
export class AdminOrdersController {
  @Get()
  findAll() {
    return ORDERS_SETUP;
  }
}
