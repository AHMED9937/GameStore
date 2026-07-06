import { apiGet, apiPut } from './api-client';

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
