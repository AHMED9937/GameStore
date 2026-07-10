import { describe, expect, it } from 'vitest';
import { formatIntentLinks, getIntentLinkRoute } from './intent-links';
import { SITE_PATHS } from './links';

describe('intent-links', () => {
  it('routes activation to my-games not faq only', () => {
    const route = getIntentLinkRoute('how-to-activate');
    expect(route?.primaryPath).toBe(SITE_PATHS.myGames);
    const formatted = formatIntentLinks('how-to-activate');
    expect(formatted).toContain('/my-games');
    expect(formatted).toContain('**Next step:**');
  });

  it('routes steam guard to my-games', () => {
    expect(getIntentLinkRoute('steam-guard-location')?.primaryPath).toBe(
      SITE_PATHS.myGames,
    );
  });

  it('routes lost license to recovery contact', () => {
    expect(getIntentLinkRoute('lost-license')?.primaryPath).toBe(
      SITE_PATHS.licenseRecovery,
    );
  });

  it('routes tier B payment issue to contact', () => {
    expect(getIntentLinkRoute('payment-no-license')?.primaryPath).toBe(
      SITE_PATHS.contact,
    );
  });
});
