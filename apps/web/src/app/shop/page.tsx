import { CatalogPage } from '@gamestore/web/feature-catalog';
import { buildPageMetadata } from '@gamestore/shared/seo';

export const revalidate = 60;

export const metadata = buildPageMetadata('shop');

export default function Page() {
  return <CatalogPage />;
}
