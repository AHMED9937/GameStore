import type { Prisma } from '@prisma/client';

export function normalizeSearchTerm(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeEnumFilter<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return allowed.includes(normalized as T) ? (normalized as T) : undefined;
}

export function buildContainsFilter(
  term: string | undefined,
): { contains: string; mode: 'insensitive' } | undefined {
  const normalized = normalizeSearchTerm(term);
  if (!normalized) {
    return undefined;
  }
  return { contains: normalized, mode: 'insensitive' };
}

export function buildExactFilter(
  value: string | undefined,
): { equals: string; mode: 'insensitive' } | undefined {
  const normalized = normalizeSearchTerm(value);
  if (!normalized) {
    return undefined;
  }
  return { equals: normalized, mode: 'insensitive' };
}

export type PrismaStringFilter = Prisma.StringFilter;
