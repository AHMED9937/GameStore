import { ContactPage } from '@gamestore/web/feature-contact';
import { buildPageMetadata } from '@gamestore/shared/seo';

export const metadata = buildPageMetadata('contact');

export default function Page() {
  return <ContactPage />;
}
