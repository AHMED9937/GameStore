import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AuditLogService,
  CurrentUser,
  Public,
  Roles,
  auditContextFromRequest,
  licenseKeyAuditHint,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import {
  buildDefaultRouteThrottle,
  throttleLimitLicenseValidate,
} from '../../security/throttle.config';
import {
  CreateLicenseDto,
  LicensesService,
} from './licenses.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Controller('licenses')
export class LicensesController {
  constructor(
    private readonly licenses: LicensesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @Throttle(buildDefaultRouteThrottle(throttleLimitLicenseValidate()))
  @Post('validate')
  @HttpCode(200)
  async validate(
    @Body() body: { licenseKey?: string },
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: AuditRequest,
  ) {
    const licenseKey = body?.licenseKey ?? '';
    const result = await this.licenses.validate(licenseKey, user);

    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user?.id ?? null,
      action: 'license.validate',
      resource: 'license',
      resourceId: result.game.id,
      metadata: {
        licenseKeyHint: licenseKeyAuditHint(licenseKey),
        status: result.status,
        gameSlug: result.game.slug,
      },
    });

    return result;
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.licenses.findMine(user);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.licenses.findAll();
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.licenses.findOne(id);
  }

  @Roles('admin')
  @Post()
  async create(
    @Body() body: CreateLicenseDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const license = await this.licenses.create(body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.license.create',
      resource: 'license',
      resourceId: license.id,
      metadata: {
        gameId: body.gameId,
        licenseKeyHint: licenseKeyAuditHint(body.licenseKey),
      },
    });
    return license;
  }

  @Roles('admin')
  @Post(':id/revoke')
  async revoke(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const license = await this.licenses.revoke(id);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.license.revoke',
      resource: 'license',
      resourceId: id,
      metadata: { status: license.status },
    });
    return license;
  }
}
