import type { GameSystemRequirementsFormValues } from '@gamestore/shared/game-requirements';
import {
  EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM,
  fromRequirementsFormValues,
  toRequirementsFormValues,
  type GameSystemRequirements,
} from '@gamestore/shared/game-requirements';

export type AdminGameFormValues = {
  title: string;
  slug: string;
  platform: string;
  description: string;
  priceBase: string;
  coverImage: string;
  releaseDate: string;
  genresText: string;
  requirementsMin: GameSystemRequirementsFormValues;
  requirementsRecommended: GameSystemRequirementsFormValues;
  published: boolean;
  soldOutManual: boolean;
};

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
  soldOut: boolean;
  soldOutManual: boolean;
  featuredOrder: number | null;
  igdbId: number | null;
  hasActivePool?: boolean;
  readinessLabel?: 'Draft' | 'Ready' | 'Published';
};

export type AdminGameIgdbMeta = {
  igdbId: number | null;
  igdbSyncedAt: string | null;
  igdbCoverUrl: string | null;
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
  requirementsMin: { ...EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM },
  requirementsRecommended: { ...EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM },
  published: false,
  soldOutManual: false,
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

function parseRequirementsField(
  value: unknown,
): GameSystemRequirementsFormValues {
  if (!value || typeof value !== 'object') {
    return { ...EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM };
  }

  return toRequirementsFormValues(value as GameSystemRequirements);
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
    requirementsMin: fromRequirementsFormValues(values.requirementsMin),
    requirementsRecommended: fromRequirementsFormValues(
      values.requirementsRecommended,
    ),
    published: values.published,
    soldOut: values.soldOutManual,
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
    requirementsMin: parseRequirementsField(data.requirementsMin),
    requirementsRecommended: parseRequirementsField(data.requirementsRecommended),
    published: Boolean(data.published),
    soldOutManual: Boolean(data.soldOutManual),
  };
}
