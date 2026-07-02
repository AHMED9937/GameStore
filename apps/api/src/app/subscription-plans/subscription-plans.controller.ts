import { Controller, Get } from '@nestjs/common';
import { Public } from '@gamestore/api/auth';
import { SubscriptionPlansService } from './subscription-plans.service';

@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly plans: SubscriptionPlansService) {}

  @Public()
  @Get()
  findAll() {
    return this.plans.findPublic();
  }
}
