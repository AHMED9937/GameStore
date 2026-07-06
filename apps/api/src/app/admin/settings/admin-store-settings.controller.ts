import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import {
  AuditLogService,
  CurrentUser,
  Roles,
  auditContextFromRequest,
  recordAudit,
  type AuthUser,
} from '@gamestore/api/auth';
import { AdminStoreSettingsService } from './admin-store-settings.service';
import { parseUpdateActivationVideoBody } from './update-activation-video.dto';

type AuditRequest = Parameters<typeof auditContextFromRequest>[0];

@Roles('admin')
@Controller('admin/settings')
export class AdminStoreSettingsController {
  constructor(
    private readonly storeSettings: AdminStoreSettingsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('activation-video')
  getDefaultActivationVideo() {
    return this.storeSettings.getDefaultActivationVideo();
  }

  @Put('activation-video')
  async updateDefaultActivationVideo(
    @Body() body: { url?: string | null },
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const result = await this.storeSettings.updateDefaultActivationVideo(
      parseUpdateActivationVideoBody(body),
    );
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.store_setting.activation_video.update',
      resource: 'store_setting',
      resourceId: 'default_activation_video_url',
      metadata: { hasUrl: result.url !== null },
    });
    return result;
  }
}
