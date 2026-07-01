import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import {
  AuditLogService,
  CurrentUser,
  Public,
  auditContextFromRequest,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import { StripeService } from '@gamestore/api/stripe';
import {
  buildDefaultRouteThrottle,
  throttleLimitCheckout,
} from '../../security/throttle.config';
import { CreateCheckoutDto, PaymentsService } from './payments.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly stripe: StripeService,
    private readonly payments: PaymentsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get('health')
  health() {
    return this.stripe.health();
  }

  @Public()
  @Throttle(buildDefaultRouteThrottle(throttleLimitCheckout()))
  @Post('checkout')
  @HttpCode(200)
  async checkout(
    @Body() body: CreateCheckoutDto,
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: AuditRequest,
  ) {
    const result = await this.payments.createCheckout(body, user);

    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user?.id ?? null,
      action: 'payment.checkout.create',
      resource: 'order',
      resourceId: result.sessionId,
      metadata: {
        gameId: body.gameId,
        gameSlug: body.slug,
        sessionIdHint: result.sessionId.slice(0, 12),
      },
    });

    return result;
  }
}
