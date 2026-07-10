import { apiGetPublic } from './api-client';

export type FaqUbisoftSettings = {
  method1VideoUrl: string | null;
  method2VideoUrl: string | null;
  lockerDownloadUrl: string | null;
  lockerGithubUrl: string | null;
};

export const EMPTY_FAQ_UBISOFT_SETTINGS: FaqUbisoftSettings = {
  method1VideoUrl: null,
  method2VideoUrl: null,
  lockerDownloadUrl: null,
  lockerGithubUrl: null,
};

export function getFaqUbisoftSettings() {
  return apiGetPublic<FaqUbisoftSettings>('/settings/faq-ubisoft', {
    revalidate: 300,
    tags: ['faq-ubisoft-settings'],
  });
}
