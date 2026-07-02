import { Controller, Get } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '@gamestore/api/auth';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.subscriptions.findMine(user.id);
  }
}
