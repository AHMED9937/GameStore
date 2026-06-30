import { CatalogFilters } from './components/catalog-filters';
import { CatalogGrid } from './components/catalog-grid';
import { CatalogHero } from './components/catalog-hero';
import { CatalogSearch } from './components/catalog-search';

export function CatalogPage() {
  return (
    <>
      <CatalogHero />
      <CatalogSearch />
      <CatalogFilters />
      <CatalogGrid />
    </>
  );
}
