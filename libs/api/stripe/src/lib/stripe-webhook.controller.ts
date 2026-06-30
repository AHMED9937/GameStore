import { Controller, Post, SetMetadata } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { StripeConfig } from './stripe.config';

const Public = () => SetMetadata('isPublic', true);

/** Setup shell — TODO(implement-stripe): verify signatures and handle Stripe events */
@Public()
@SkipThrottle()
@Controller('payments/webhook')
export class StripeWebhookController {
  @Post()
  handleWebhook() {
    return StripeConfig.getSetupResponse('webhook');
  }
}
