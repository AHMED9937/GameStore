import { siteConfig } from './site-config';

describe('siteConfig', () => {
  it('reads env vars without throwing', () => {
    expect(siteConfig.siteName).toBeTruthy();
    expect(siteConfig.siteUrl).toMatch(/^https?:\/\//);
    expect(siteConfig.defaultOgImage).toBeTruthy();
  });
});
