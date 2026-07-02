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
import { SubscriptionFulfillmentService } from './subscription-fulfillment.service';

type WebhookRequest = {
  rawBody?: Buffer;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type WebhookHandlerResult = {
  action: string;
  orderId?: string;
  licenseId?: string;
  subscriptionId?: string;
  licenseIds?: string[];
};

@SkipThrottle()
@Controller('payments/webhook')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly fulfillment: PaymentFulfillmentService,
    private readonly subscriptionFulfillment: SubscriptionFulfillmentService,
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

    if (this.shouldAudit(result)) {
      recordAudit(this.auditLogService, {
        userId: null,
        action: this.auditActionFor(result.action),
        resource: result.subscriptionId ? 'user_subscription' : 'order',
        resourceId: result.subscriptionId ?? result.orderId ?? null,
        ip: request.ip ?? null,
        metadata: {
          stripeEventId: event.id,
          stripeEventType: event.type,
          fulfillment: result.action,
          licenseId: result.licenseId,
          licenseIds: result.licenseIds,
        },
      });
    }

    return { received: true, action: result.action };
  }

  private async routeEvent(event: Stripe.Event): Promise<WebhookHandlerResult> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          return this.subscriptionFulfillment.handleCheckoutSessionCompleted(session);
        }
        return this.fulfillment.handleCheckoutSessionCompleted(session);
      }
      case 'invoice.paid':
        return this.subscriptionFulfillment.handleInvoicePaid(
          event.data.object as Stripe.Invoice,
        );
      case 'customer.subscription.updated':
        return this.subscriptionFulfillment.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
      case 'customer.subscription.deleted':
        return this.subscriptionFulfillment.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' || !session.id) {
          return { action: 'ignored' };
        }
        return this.fulfillment.handleCheckoutSessionFailed(session.id);
      }
      default:
        this.logger.debug(`Ignoring unhandled Stripe event ${event.type}`);
        return { action: 'ignored' };
    }
  }

  private shouldAudit(result: WebhookHandlerResult): boolean {
    return [
      'fulfilled',
      'already_fulfilled',
      'subscription_fulfilled',
      'subscription_already_fulfilled',
      'subscription_renewed',
      'subscription_synced',
      'subscription_ended',
    ].includes(result.action);
  }

  private auditActionFor(action: string): string {
    if (action.startsWith('subscription_')) {
      return `payment.webhook.${action}`;
    }
    return 'payment.webhook.completed';
  }
}
