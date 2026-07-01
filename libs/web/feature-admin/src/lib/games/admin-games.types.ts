export type AdminGameTab =
  | 'basics'
  | 'storefront'
  | 'requirements'
  | 'media'
  | 'accounts'
  | 'publish';

export type AdminGameListItem = {
  id: string;
  title: string;
  slug: string;
  platform: string;
  priceBase: string;
  published: boolean;
  igdbId: number | null;
  hasActivePool?: boolean;
  readinessLabel?: 'Draft' | 'Ready' | 'Published';
};

export type AdminGameFormValues = {
  title: string;
  slug: string;
  platform: string;
  description: string;
  priceBase: string;
  coverImage: string;
  releaseDate: string;
  genresText: string;
  requirementsMin: string;
  requirementsRecommended: string;
  published: boolean;
};

export const EMPTY_ADMIN_GAME_FORM_VALUES: AdminGameFormValues = {
  title: '',
  slug: '',
  platform: 'steam',
  description: '',
  priceBase: '9.99',
  coverImage: '/og/default.png',
  releaseDate: '',
  genresText: '',
  requirementsMin: '',
  requirementsRecommended: '',
  published: false,
};

export function genresTextToArray(text: string): string[] {
  return text
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
}

export function genresArrayToText(genres: string[]): string {
  return genres.join(', ');
}

export function toAdminGameInput(values: AdminGameFormValues) {
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    platform: values.platform.trim() || 'steam',
    description: values.description.trim() || undefined,
    priceBase: Number.parseFloat(values.priceBase) || 0,
    coverImage: values.coverImage.trim() || undefined,
    releaseDate: values.releaseDate.trim() || null,
    genres: genresTextToArray(values.genresText),
    requirementsMin: values.requirementsMin.trim() || null,
    requirementsRecommended: values.requirementsRecommended.trim() || null,
    published: values.published,
  };
}

export function parseAdminGameForm(data: Record<string, unknown>): AdminGameFormValues {
  const genres = Array.isArray(data.genres) ? (data.genres as string[]) : [];
  return {
    title: String(data.title ?? ''),
    slug: String(data.slug ?? ''),
    platform: String(data.platform ?? 'steam'),
    description: String(data.description ?? ''),
    priceBase: String(data.priceBase ?? ''),
    coverImage: String(data.coverImage ?? ''),
    releaseDate: data.releaseDate ? String(data.releaseDate).slice(0, 10) : '',
    genresText: genresArrayToText(genres),
    requirementsMin: String(data.requirementsMin ?? ''),
    requirementsRecommended: String(data.requirementsRecommended ?? ''),
    published: Boolean(data.published),
  };
}
