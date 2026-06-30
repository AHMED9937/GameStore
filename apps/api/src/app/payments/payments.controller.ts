import { Controller, Get, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@gamestore/api/auth';
import { StripeService } from '@gamestore/api/stripe';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly stripe: StripeService) {}

  @Public()
  @SkipThrottle()
  @Get('health')
  health() {
    return this.stripe.health();
  }

  @Post('checkout')
  checkout() {
    return this.stripe.createCheckout();
  }
}
