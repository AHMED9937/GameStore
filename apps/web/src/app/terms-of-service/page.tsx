import { LegalPage } from '@gamestore/web/feature-legal';
import { buildPageMetadata } from '@gamestore/shared/seo';

export const metadata = buildPageMetadata('terms');

export default function Page() {
  return <LegalPage document="terms" />;
}
