import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  AuditLogService,
  CurrentUser,
  Roles,
  auditContextFromRequest,
  licenseKeyAuditHint,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import {
  AdminLicensesService,
  type CreateAdminLicenseDto,
  type GenerateAdminLicenseDto,
} from './admin-licenses.service';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/licenses')
export class AdminLicensesController {
  constructor(
    private readonly licenses: AdminLicensesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll() {
    return this.licenses.findAll();
  }

  @Post('generate-key')
  @HttpCode(201)
  async generateKey(
    @Body() body: GenerateAdminLicenseDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const license = await this.licenses.generateKey(body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.license.generate',
      resource: 'license',
      resourceId: license.id,
      metadata: {
        gameId: body.gameId,
        licenseKeyHint: licenseKeyAuditHint(license.licenseKey),
      },
    });
    return license;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.licenses.findOne(id);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: CreateAdminLicenseDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const licenses = await this.licenses.create(body);
    for (const license of licenses) {
      recordAudit(this.auditLogService, {
        ...auditContextFromRequest(request),
        userId: user.id,
        action: 'admin.license.create',
        resource: 'license',
        resourceId: license.id,
        metadata: {
          gameId: body.gameId,
          licenseKeyHint: licenseKeyAuditHint(license.licenseKey),
        },
      });
    }
    return licenses.length === 1 ? licenses[0] : { licenses };
  }

  @Post(':id/revoke')
  @HttpCode(200)
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
