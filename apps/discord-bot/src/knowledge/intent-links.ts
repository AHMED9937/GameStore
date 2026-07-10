import { siteLink, SITE_PATHS } from './links';

export type IntentLinkRoute = {
  primaryPath: string;
  primaryLabel: string;
  secondaryPath?: string;
  secondaryLabel?: string;
};

const ROUTES: Record<string, IntentLinkRoute> = {
  'how-to-activate': {
    primaryPath: SITE_PATHS.myGames,
    primaryLabel: 'Open My Games',
    secondaryPath: SITE_PATHS.faq,
    secondaryLabel: 'FAQ',
  },
  'steam-guard-location': {
    primaryPath: SITE_PATHS.myGames,
    primaryLabel: 'Get Steam Guard on My Games',
  },
  'steam-guard-cooldown': {
    primaryPath: SITE_PATHS.myGames,
    primaryLabel: 'Refresh code on My Games',
  },
  'sign-in-required': {
    primaryPath: SITE_PATHS.myGames,
    primaryLabel: 'Sign in on My Games',
  },
  'checkout-success': {
    primaryPath: SITE_PATHS.myGames,
    primaryLabel: 'Open My Games',
  },
  'lost-license': {
    primaryPath: SITE_PATHS.licenseRecovery,
    primaryLabel: 'Recover license',
  },
  'where-to-buy': {
    primaryPath: SITE_PATHS.shop,
    primaryLabel: 'Browse shop',
  },
  'sold-out': {
    primaryPath: SITE_PATHS.shop,
    primaryLabel: 'Browse shop',
  },
  subscriptions: {
    primaryPath: SITE_PATHS.subscriptions,
    primaryLabel: 'View subscriptions',
    secondaryPath: SITE_PATHS.myGames,
    secondaryLabel: 'My Games',
  },
  'steam-offline': {
    primaryPath: SITE_PATHS.myGames,
    primaryLabel: 'Activate on My Games',
    secondaryPath: SITE_PATHS.faq,
    secondaryLabel: 'Offline FAQ',
  },
  'ubisoft-offline': {
    primaryPath: SITE_PATHS.faq,
    primaryLabel: 'Ubisoft offline FAQ',
    secondaryPath: SITE_PATHS.myGames,
    secondaryLabel: 'My Games',
  },
  'personal-saves': {
    primaryPath: SITE_PATHS.faq,
    primaryLabel: 'Saves FAQ',
  },
  'games-to-replace': {
    primaryPath: SITE_PATHS.myGames,
    primaryLabel: 'Check My Games',
    secondaryPath: SITE_PATHS.faq,
    secondaryLabel: 'FAQ',
  },
  'wrong-credentials': {
    primaryPath: SITE_PATHS.contact,
    primaryLabel: 'Contact support',
    secondaryPath: SITE_PATHS.myGames,
    secondaryLabel: 'My Games',
  },
  'payment-no-license': {
    primaryPath: SITE_PATHS.contact,
    primaryLabel: 'Contact support',
    secondaryPath: SITE_PATHS.myGames,
    secondaryLabel: 'My Games',
  },
  'technical-edge': {
    primaryPath: SITE_PATHS.faq,
    primaryLabel: 'Troubleshooting FAQ',
    secondaryPath: SITE_PATHS.contact,
    secondaryLabel: 'Contact',
  },
};

export function getIntentLinkRoute(intentOrDocId: string | undefined): IntentLinkRoute | null {
  if (!intentOrDocId) return null;
  return ROUTES[intentOrDocId] ?? null;
}

export function formatIntentLinks(intentOrDocId: string | undefined): string {
  const route = getIntentLinkRoute(intentOrDocId);
  if (!route) return '';

  const parts = [`**Next step:** ${route.primaryLabel} — ${siteLink(route.primaryPath)}`];
  if (route.secondaryPath && route.secondaryLabel) {
    parts.push(`**More:** ${route.secondaryLabel} — ${siteLink(route.secondaryPath)}`);
  }
  return parts.join('\n');
}

export function linkMapPromptBlock(): string {
  return Object.entries(ROUTES)
    .map(
      ([id, r]) =>
        `- ${id}: primary ${siteLink(r.primaryPath)}${r.secondaryPath ? `, secondary ${siteLink(r.secondaryPath)}` : ''}`,
    )
    .join('\n');
}
