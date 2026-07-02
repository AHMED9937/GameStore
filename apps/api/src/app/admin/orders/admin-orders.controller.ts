import { Controller, Get } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { AdminOrdersService } from './admin-orders.service';

@Roles('admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrders: AdminOrdersService) {}

  @Get()
  findAll() {
    return this.adminOrders.findAll();
  }
}
