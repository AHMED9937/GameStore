import { describe, expect, it } from 'vitest';

import {
  buildContainsFilter,
  buildExactFilter,
  normalizeEnumFilter,
  normalizeSearchTerm,
} from './admin-list-filters';

describe('admin-list-filters', () => {
  it('normalizes search terms', () => {
    expect(normalizeSearchTerm('  demo  ')).toBe('demo');
    expect(normalizeSearchTerm('   ')).toBeUndefined();
    expect(normalizeSearchTerm(undefined)).toBeUndefined();
  });

  it('normalizes enum filters', () => {
    expect(normalizeEnumFilter(' Active ', ['active', 'inactive'])).toBe(
      'active',
    );
    expect(normalizeEnumFilter('unknown', ['active', 'inactive'])).toBeUndefined();
  });

  it('builds prisma string filters', () => {
    expect(buildContainsFilter('demo')).toEqual({
      contains: 'demo',
      mode: 'insensitive',
    });
    expect(buildContainsFilter('  ')).toBeUndefined();
    expect(buildExactFilter('Steam')).toEqual({
      equals: 'Steam',
      mode: 'insensitive',
    });
  });
});
