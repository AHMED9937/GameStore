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
import { SteamAccountService } from '@gamestore/api/steam';
import { buildSteamGuardThrottle } from '../../security/throttle.config';
import { SteamGuardAppService } from './steam-guard-app.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Controller('steam')
export class SteamController {
  constructor(
    private readonly steamGuardApp: SteamGuardAppService,
    private readonly steamAccount: SteamAccountService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get('health')
  health() {
    return this.steamAccount.health();
  }

  /** Requires activated license + owner match */
  @Throttle(buildSteamGuardThrottle())
  @Post('guard-code')
  async guardCode(
    @Body() body: { licenseKey?: string },
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const response = await this.steamGuardApp.requestGuardCode(
      body.licenseKey,
      user,
    );

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
