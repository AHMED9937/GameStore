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
import { PaddleMisconfiguredError, PaddleService } from '@gamestore/api/paddle';
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
    private readonly paddle: PaddleService,
    private readonly fulfillment: PaymentFulfillmentService,
    private readonly subscriptionFulfillment: SubscriptionFulfillmentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() request: WebhookRequest,
    @Headers('paddle-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing paddle-signature header');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    let event;
    try {
      event = await this.paddle.unmarshalWebhook(rawBody, signature);
    } catch (error) {
      if (error instanceof PaddleMisconfiguredError) {
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
          paddleEventId: event.eventId,
          paddleEventType: event.eventType,
          fulfillment: result.action,
          licenseId: result.licenseId,
          licenseIds: result.licenseIds,
        },
      });
    }

    return { received: true, action: result.action };
  }

  private async routeEvent(event: {
    eventType: string;
    data: unknown;
  }): Promise<WebhookHandlerResult> {
    switch (event.eventType) {
      case 'transaction.completed':
      case 'transaction.paid': {
        const transaction = event.data as { subscriptionId?: string | null };
        if (transaction.subscriptionId) {
          return this.subscriptionFulfillment.handleTransactionCompletedForSubscription(
            transaction as never,
          );
        }
        return this.fulfillment.handleTransactionCompleted(
          transaction as never,
        );
      }
      case 'transaction.canceled':
      case 'transaction.past_due': {
        const transaction = event.data as { id: string };
        return this.fulfillment.handleTransactionFailed(transaction.id);
      }
      case 'subscription.activated':
      case 'subscription.created': {
        return this.subscriptionFulfillment.handleSubscriptionActivated(
          event.data as never,
        );
      }
      case 'subscription.updated':
      case 'subscription.past_due':
      case 'subscription.paused':
      case 'subscription.resumed':
      case 'subscription.trialing': {
        return this.subscriptionFulfillment.handleSubscriptionUpdated(
          event.data as never,
        );
      }
      case 'subscription.canceled': {
        return this.subscriptionFulfillment.handleSubscriptionCanceled(
          event.data as never,
        );
      }
      default:
        this.logger.debug(`Ignoring unhandled Paddle event ${event.eventType}`);
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
