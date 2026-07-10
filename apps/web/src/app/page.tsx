import { HomePage } from '@gamestore/web/feature-home';
import { buildPageMetadata } from '@gamestore/shared/seo';

export const revalidate = 60;

export const metadata = buildPageMetadata('home');

export default function Page() {
  return <HomePage />;
}
