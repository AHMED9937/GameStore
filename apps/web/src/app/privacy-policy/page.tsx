import { LegalPage } from '@gamestore/web/feature-legal';
import { buildPageMetadata } from '@gamestore/shared/seo';

export const metadata = buildPageMetadata('privacy');

export default function Page() {
  return <LegalPage document="privacy" />;
}
