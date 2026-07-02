import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  AuditLogService,
  Public,
  recordAudit,
} from '@gamestore/api/auth';
import { StripeMisconfiguredError, StripeService } from '@gamestore/api/stripe';
import type Stripe from 'stripe';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

type WebhookRequest = {
  rawBody?: Buffer;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
};

@SkipThrottle()
@Controller('payments/webhook')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly fulfillment: PaymentFulfillmentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() request: WebhookRequest,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.constructWebhookEvent(rawBody, signature);
    } catch (error) {
      if (error instanceof StripeMisconfiguredError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw new BadRequestException('Invalid webhook signature');
    }

    const result = await this.routeEvent(event);

    if (result.action === 'fulfilled' || result.action === 'already_fulfilled') {
      recordAudit(this.auditLogService, {
        userId: null,
        action: 'payment.webhook.completed',
        resource: 'order',
        resourceId: result.orderId ?? null,
        ip: request.ip ?? null,
        metadata: {
          stripeEventId: event.id,
          stripeEventType: event.type,
          fulfillment: result.action,
          licenseId: result.licenseId,
        },
      });
    }

    return { received: true, action: result.action };
  }

  private async routeEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        return this.fulfillment.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.id) {
          return { action: 'ignored' as const };
        }
        return this.fulfillment.handleCheckoutSessionFailed(session.id);
      }
      default:
        this.logger.debug(`Ignoring unhandled Stripe event ${event.type}`);
        return { action: 'ignored' as const };
    }
  }
}
