import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import {
  AuditLogService,
  CurrentUser,
  Public,
  auditContextFromRequest,
  licenseKeyAuditHint,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import { SteamAccountService, SteamGuardService } from '@gamestore/api/steam';
import { buildSteamGuardThrottle } from '../../security/throttle.config';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Controller('steam')
export class SteamController {
  constructor(
    private readonly steamGuard: SteamGuardService,
    private readonly steamAccount: SteamAccountService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get('health')
  health() {
    return this.steamAccount.health();
  }

  /** Body accepted for Phase 6 — ignored until Guard is implemented */
  @Throttle(buildSteamGuardThrottle())
  @Post('guard-code')
  guardCode(
    @Body() body: { licenseKey?: string },
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const response = this.steamGuard.requestGuardCode();

    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'steam.guard.request',
      resource: 'steam',
      metadata: {
        licenseKeyHint: body.licenseKey
          ? licenseKeyAuditHint(body.licenseKey)
          : null,
      },
    });

    return response;
  }
}
