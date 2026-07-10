import { buildPageMetadata } from './build-page-metadata';

describe('buildPageMetadata', () => {
  it('returns unique titles and canonical urls per page', () => {
    const home = buildPageMetadata('home');
    const shop = buildPageMetadata('shop');

    expect(home.title).toContain('Premium offline game activation');
    expect(shop.title).toContain('Shop PC Games');
    expect(home.title).not.toBe(shop.title);
    expect(home.alternates?.canonical).toContain('/');
    expect(shop.alternates?.canonical).toContain('/shop');
  });

  it('includes open graph and twitter metadata', () => {
    const faq = buildPageMetadata('faq');
    expect(faq.openGraph?.title).toContain('FAQ');
    expect(faq.twitter?.card).toBe('summary_large_image');
  });
});
