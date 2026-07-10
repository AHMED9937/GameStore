import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
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
import { BulkIdsDto } from '../dto/bulk-ids.dto';
import {
  AdminLicensesService,
  type CreateAdminLicenseDto,
  type GenerateAdminLicenseDto,
  type UpdateAdminLicenseDto,
} from './admin-licenses.service';
import type { AdminLicenseListFiltersDto } from './admin-license-list-filters.dto';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/licenses')
export class AdminLicensesController {
  constructor(
    private readonly licenses: AdminLicensesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll(@Query() Filters: AdminLicenseListFiltersDto) {
    return this.licenses.findAll(Filters);
  }

  @Post('bulk-revoke')
  @HttpCode(200)
  async bulkRevoke(
    @Body() body: BulkIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.licenses.bulkRevoke(body.ids);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.license.bulk_revoke',
      resource: 'license',
      resourceId: null,
      metadata: {
        ids: body.ids,
        succeeded: result.succeeded,
        failed: result.failed,
      },
    });
    return result;
  }

  @Post('bulk-delete')
  @HttpCode(200)
  async bulkDelete(
    @Body() body: BulkIdsDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.licenses.bulkDelete(body.ids);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.license.bulk_delete',
      resource: 'license',
      resourceId: null,
      metadata: {
        ids: body.ids,
        succeeded: result.succeeded,
        failed: result.failed,
      },
    });
    return result;
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

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAdminLicenseDto,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const license = await this.licenses.update(id, body);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.license.update',
      resource: 'license',
      resourceId: id,
      metadata: {
        licenseKeyHint: licenseKeyAuditHint(license.licenseKey),
        ...(body.buyerEmail !== undefined ? { buyerEmail: body.buyerEmail } : {}),
        ...(body.buyerCountry !== undefined
          ? { buyerCountry: body.buyerCountry }
          : {}),
      },
    });
    return license;
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

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.licenses.remove(id);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.license.delete',
      resource: 'license',
      resourceId: id,
    });
    return result;
  }
}
