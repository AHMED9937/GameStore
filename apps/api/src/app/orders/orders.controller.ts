import {
  Controller,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import {
  CurrentUser,
  Public,
  Roles,
  type AuthUser,
} from '@gamestore/api/auth';
import { OrdersService } from './orders.service';

type MutableResponse = {
  status(code: number): void;
};

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Public()
  @Post('by-session/:sessionId/cancel')
  cancelBySession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthUser | undefined,
  ) {
    return this.orders.cancelCheckoutBySession(sessionId, user);
  }

  @Public()
  @Get('by-session/:sessionId')
  async findBySession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthUser | undefined,
    @Res({ passthrough: true }) response: MutableResponse,
  ) {
    const result = await this.orders.getCheckoutBySession(sessionId, user);

    if (result.status === 'pending') {
      response.status(202);
    }

    return result;
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.orders.findAll();
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }
}
