import { describe, expect, it } from 'vitest';
import {
  EMPTY_ADMIN_GAME_FORM_VALUES,
  parseAdminGameForm,
  toAdminGameInput,
} from './admin-games.types';

describe('admin-games.types SEO fields', () => {
  it('parseAdminGameForm maps SEO fields from API response', () => {
    const values = parseAdminGameForm({
      title: 'Demo',
      slug: 'demo',
      metaTitle: 'Custom title',
      metaDescription: 'Custom description',
      ogImage: 'https://cdn.example.com/og.png',
    });

    expect(values.metaTitle).toBe('Custom title');
    expect(values.metaDescription).toBe('Custom description');
    expect(values.ogImage).toBe('https://cdn.example.com/og.png');
  });

  it('toAdminGameInput sends trimmed SEO fields', () => {
    const input = toAdminGameInput({
      ...EMPTY_ADMIN_GAME_FORM_VALUES,
      title: 'Demo',
      slug: 'demo',
      metaTitle: '  SEO title  ',
      metaDescription: ' SEO description ',
      ogImage: ' https://cdn.example.com/og.png ',
    });

    expect(input.metaTitle).toBe('SEO title');
    expect(input.metaDescription).toBe('SEO description');
    expect(input.ogImage).toBe('https://cdn.example.com/og.png');
  });

  it('toAdminGameInput omits blank SEO fields so API stores null', () => {
    const input = toAdminGameInput({
      ...EMPTY_ADMIN_GAME_FORM_VALUES,
      title: 'Demo',
      slug: 'demo',
      metaTitle: '   ',
      metaDescription: '',
      ogImage: '',
    });

    expect(input.metaTitle).toBeUndefined();
    expect(input.metaDescription).toBeUndefined();
    expect(input.ogImage).toBeUndefined();
  });

  it('parseAdminGameForm maps discord announcement from API response', () => {
    const values = parseAdminGameForm({
      title: 'Demo',
      slug: 'demo',
      discord: { announceDescription: 'Launch week!' },
    });

    expect(values.discordAnnounceDescription).toBe('Launch week!');
  });

  it('toAdminGameInput sends discord announcement text', () => {
    const input = toAdminGameInput({
      ...EMPTY_ADMIN_GAME_FORM_VALUES,
      title: 'Demo',
      slug: 'demo',
      discordAnnounceDescription: '  Discord copy  ',
    });

    expect(input.discordAnnounceDescription).toBe('Discord copy');
  });
});
