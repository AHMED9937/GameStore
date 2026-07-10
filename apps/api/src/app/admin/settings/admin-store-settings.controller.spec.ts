import { describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { AdminStoreSettingsController } from './admin-store-settings.controller';
import type { AdminStoreSettingsService } from './admin-store-settings.service';

describe('AdminStoreSettingsController', () => {
  const storeSettings = {
    getDefaultActivationVideo: vi
      .fn()
      .mockResolvedValue({ url: 'https://www.youtube.com/embed/abc' }),
    updateDefaultActivationVideo: vi
      .fn()
      .mockResolvedValue({ url: 'https://www.youtube.com/embed/abc' }),
    getFaqUbisoftSettings: vi.fn().mockResolvedValue({
      method1VideoUrl: null,
      method2VideoUrl: null,
      lockerDownloadUrl: null,
      lockerGithubUrl: null,
    }),
    updateFaqUbisoftSettings: vi.fn().mockResolvedValue({
      method1VideoUrl: 'https://www.youtube.com/embed/m1',
      method2VideoUrl: null,
      lockerDownloadUrl: null,
      lockerGithubUrl: null,
    }),
  } satisfies Pick<
    AdminStoreSettingsService,
    | 'getDefaultActivationVideo'
    | 'updateDefaultActivationVideo'
    | 'getFaqUbisoftSettings'
    | 'updateFaqUbisoftSettings'
  >;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditLogService;

  const controller = new AdminStoreSettingsController(
    storeSettings as unknown as AdminStoreSettingsService,
    auditLogService,
  );

  const user = {
    id: 'admin-1',
    clerkId: 'clerk-admin',
    email: 'admin@example.com',
    role: 'admin' as const,
  };

  const request = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'vitest' },
  } as Parameters<AdminStoreSettingsController['updateDefaultActivationVideo']>[2];

  it('getDefaultActivationVideo delegates to service', async () => {
    await expect(controller.getDefaultActivationVideo()).resolves.toEqual({
      url: 'https://www.youtube.com/embed/abc',
    });
  });

  it('updateDefaultActivationVideo delegates to service and audits', async () => {
    await expect(
      controller.updateDefaultActivationVideo(
        { url: 'https://youtu.be/abc123XYZ12' },
        user,
        request,
      ),
    ).resolves.toEqual({ url: 'https://www.youtube.com/embed/abc' });
    expect(storeSettings.updateDefaultActivationVideo).toHaveBeenCalled();
    expect(auditLogService.log).toHaveBeenCalled();
  });

  it('updateFaqUbisoftSettings delegates to service and audits', async () => {
    await expect(
      controller.updateFaqUbisoftSettings(
        { method1VideoUrl: 'https://youtu.be/abc123XYZ12' },
        user,
        request,
      ),
    ).resolves.toEqual({
      method1VideoUrl: 'https://www.youtube.com/embed/m1',
      method2VideoUrl: null,
      lockerDownloadUrl: null,
      lockerGithubUrl: null,
    });
    expect(storeSettings.updateFaqUbisoftSettings).toHaveBeenCalled();
    expect(auditLogService.log).toHaveBeenCalled();
  });
});
