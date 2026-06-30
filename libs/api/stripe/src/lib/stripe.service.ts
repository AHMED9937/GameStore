import { Injectable } from '@nestjs/common';
import { StripeConfig } from './stripe.config';

/** Setup shell — TODO(implement-stripe): instantiate Stripe client and create Checkout Sessions */
@Injectable()
export class StripeService {
  health() {
    return StripeConfig.getHealthResponse();
  }

  /** TODO(implement-stripe) */
  createCheckout() {
    return StripeConfig.getSetupResponse('checkout');
  }
}
