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
import { parseUpdateFaqUbisoftSettingsBody } from './update-faq-ubisoft-settings.dto';

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

  @Get('faq-ubisoft')
  getFaqUbisoftSettings() {
    return this.storeSettings.getFaqUbisoftSettings();
  }

  @Put('faq-ubisoft')
  async updateFaqUbisoftSettings(
    @Body() body: Parameters<typeof parseUpdateFaqUbisoftSettingsBody>[0],
    @CurrentUser() user: AuthUser,
    @Req() request: AuditRequest,
  ) {
    const parsed = parseUpdateFaqUbisoftSettingsBody(body);
    const result = await this.storeSettings.updateFaqUbisoftSettings(parsed);
    recordAudit(this.auditLogService, {
      ...auditContextFromRequest(request),
      userId: user.id,
      action: 'admin.store_setting.faq_ubisoft.update',
      resource: 'store_setting',
      resourceId: 'faq_ubisoft',
      metadata: {
        hasMethod1Video: result.method1VideoUrl !== null,
        hasMethod2Video: result.method2VideoUrl !== null,
        hasLockerDownload: result.lockerDownloadUrl !== null,
        hasLockerGithub: result.lockerGithubUrl !== null,
      },
    });
    return result;
  }
}
