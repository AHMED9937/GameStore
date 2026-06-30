import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';

const setupResponse = {
  status: 'setup' as const,
  integration: 'orders',
  message: 'Orders — not implemented yet',
};

/** Setup only — no Order model yet; ownership checks land with Phase 7 Order.ownerId */
@Roles('admin')
@Controller('orders')
export class OrdersController {
  @Get()
  findAll() {
    return setupResponse;
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return setupResponse;
  }
}
