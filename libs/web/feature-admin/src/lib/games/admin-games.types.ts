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
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  published: boolean;
  soldOutManual: boolean;
  discordAnnounceDescription: string;
};

export type AdminGameTab =
  | 'basics'
  | 'storefront'
  | 'requirements'
  | 'media'
  | 'accounts'
  | 'marketing'
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
  metaTitle: '',
  metaDescription: '',
  ogImage: '',
  published: false,
  soldOutManual: false,
  discordAnnounceDescription: '',
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
    metaTitle: values.metaTitle.trim() || undefined,
    metaDescription: values.metaDescription.trim() || undefined,
    ogImage: values.ogImage.trim() || undefined,
    published: values.published,
    soldOut: values.soldOutManual,
    discordAnnounceDescription:
      values.discordAnnounceDescription.trim() || null,
  };
}

export function parseAdminGameForm(data: unknown): AdminGameFormValues {
  const record =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const genres = Array.isArray(record.genres) ? (record.genres as string[]) : [];
  return {
    title: String(record.title ?? ''),
    slug: String(record.slug ?? ''),
    platform: String(record.platform ?? 'steam'),
    description: String(record.description ?? ''),
    priceBase: String(record.priceBase ?? ''),
    coverImage: String(record.coverImage ?? ''),
    releaseDate: record.releaseDate ? String(record.releaseDate).slice(0, 10) : '',
    genresText: genresArrayToText(genres),
    requirementsMin: parseRequirementsField(record.requirementsMin),
    requirementsRecommended: parseRequirementsField(record.requirementsRecommended),
    metaTitle: String(record.metaTitle ?? ''),
    metaDescription: String(record.metaDescription ?? ''),
    ogImage: String(record.ogImage ?? ''),
    published: Boolean(record.published),
    soldOutManual: Boolean(record.soldOutManual),
    discordAnnounceDescription: String(
      (record.discord as { announceDescription?: string | null } | undefined)
        ?.announceDescription ??
        record.discordAnnounceDescription ??
        '',
    ),
  };
}
