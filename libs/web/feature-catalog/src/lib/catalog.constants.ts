export type CatalogPlatformFilter = 'all' | 'steam' | 'epic' | 'microsoft' | 'ubisoft';

export type CatalogFilterOption = {
  id: CatalogPlatformFilter;
  label: string;
  platform: string | null;
};

export const CATALOG_PLATFORM_FILTERS: CatalogFilterOption[] = [
  { id: 'all', label: 'All Games', platform: null },
  { id: 'steam', label: 'Steam', platform: 'steam' },
  { id: 'epic', label: 'Epic Games', platform: 'epic' },
  { id: 'microsoft', label: 'Microsoft', platform: 'microsoft' },
  { id: 'ubisoft', label: 'Ubisoft', platform: 'ubisoft' },
];

export const CATALOG_HERO_DESCRIPTION =
  'Instant-access shared accounts for top PC titles secure checkout, offline Steam play, and warranty-backed support.';
