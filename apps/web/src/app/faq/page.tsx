import { FaqPage } from '@gamestore/web/feature-faq';
import { buildPageMetadata } from '@gamestore/shared/seo';
import {
  EMPTY_FAQ_UBISOFT_SETTINGS,
  getFaqUbisoftSettings,
} from '@gamestore/web/data-access';

export const metadata = buildPageMetadata('faq');
export default async function Page() {
  let ubisoftSettings = EMPTY_FAQ_UBISOFT_SETTINGS;

  try {
    ubisoftSettings = await getFaqUbisoftSettings();
  } catch {
    // FAQ still renders when settings API is unavailable.
  }

  return <FaqPage ubisoftSettings={ubisoftSettings} />;
}
