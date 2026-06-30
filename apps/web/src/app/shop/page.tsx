import { CatalogPage } from '@gamestore/web/feature-catalog';

/** Fetch catalog from the API on each request — not at build time */
export const dynamic = 'force-dynamic';

export default function Page() {
  return <CatalogPage />;
}
