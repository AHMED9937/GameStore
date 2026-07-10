import { apiGet, apiPut } from './api-client';
import type { FaqUbisoftSettings } from './store-settings.api';

export type DefaultActivationVideoSetting = {
  url: string | null;
};

export function getDefaultActivationVideo() {
  return apiGet<DefaultActivationVideoSetting>(
    '/admin/settings/activation-video',
  );
}

export function updateDefaultActivationVideo(url: string | null) {
  return apiPut<DefaultActivationVideoSetting>(
    '/admin/settings/activation-video',
    { url },
  );
}

export function getAdminFaqUbisoftSettings() {
  return apiGet<FaqUbisoftSettings>('/admin/settings/faq-ubisoft');
}

export function updateAdminFaqUbisoftSettings(
  settings: Partial<FaqUbisoftSettings>,
) {
  return apiPut<FaqUbisoftSettings>('/admin/settings/faq-ubisoft', settings);
}
