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
    expect(faq.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('registers the legal pages with correct canonical paths', () => {
    const terms = buildPageMetadata('terms');
    const privacy = buildPageMetadata('privacy');
    const refund = buildPageMetadata('refund');

    expect(terms.title).toContain('Terms of Service');
    expect(terms.alternates?.canonical).toContain('/terms-of-service');
    expect(privacy.title).toContain('Privacy Policy');
    expect(privacy.alternates?.canonical).toContain('/privacy-policy');
    expect(refund.title).toContain('Refund Policy');
    expect(refund.alternates?.canonical).toContain('/refund-policy');
  });
});
