/**
 * FAQ + guide knowledge pack for the Discord support bot.
 * Aligned with site FAQ (faq.constants.ts) and My Games / Steam flows.
 */
import {
  DISCORD_CHANNELS,
  getSiteUrl,
  siteLink,
  SITE_PATHS,
} from './links';
import type { KnowledgeDoc } from './types';
import { formatIntentLinks } from './intent-links';
import { retrieveKnowledge } from './retrieve';

const COOLDOWN_MINUTES =
  process.env['STEAM_GUARD_COOLDOWN_MINUTES']?.trim() || '15';

export const KNOWLEDGE_DOCS: readonly KnowledgeDoc[] = [
  {
    id: 'games-to-replace',
    title: 'Why are some games marked "to replace"?',
    tier: 'A',
    tags: ['library', 'account', 'replace', 'badge'],
    keywords: [
      'replace',
      'to replace',
      'not working',
      'account not working',
      'broken account',
      'badge',
    ],
    sitePath: SITE_PATHS.myGames,
    discordChannel: DISCORD_CHANNELS.tickets,
    body: [
      'Following recent Steam account issues, some games may show in **Games to Replace** with an **Account not working** badge.',
      'Popular games are replaced first. Replacing every account takes time — some games may never be replaced.',
      'The subscription catalogue was temporarily shortened; replace badges apply to one-time licenses.',
      '**No action required** — access restores automatically when accounts are replaced.',
      'If urgent, open a thread in 🎫 | tickets.',
    ].join('\n'),
  },
  {
    id: 'personal-saves',
    title: 'Personal game saves',
    tier: 'A',
    tags: ['saves', 'cloud', 'sync'],
    keywords: ['save', 'saves', 'cloud', 'cloud sync', 'overwrite', 'progress'],
    sitePath: SITE_PATHS.faq,
    body: [
      'Yes — saves are stored **locally on your PC** and belong to you.',
      '**Important:** Disable cloud save sync on Steam, Ubisoft Connect, etc.',
      'If cloud sync stays on, another user on the shared account could overwrite your saves.',
    ].join('\n'),
  },
  {
    id: 'lost-license',
    title: 'Lost or forgot license',
    tier: 'A',
    tags: ['license', 'key', 'recovery'],
    keywords: [
      'lost license',
      'forgot license',
      'forgot key',
      'lost key',
      'recover license',
      'license recovery',
      'dont remember key',
    ],
    sitePath: SITE_PATHS.licenseRecovery,
    body: [
      'Enter the **email used for purchase** on the license recovery page.',
      'We never paste license keys in Discord — use the website only.',
      `Recover: ${siteLink(SITE_PATHS.licenseRecovery)}`,
    ].join('\n'),
  },
  {
    id: 'ubisoft-offline',
    title: 'Ubisoft offline mode',
    tier: 'A',
    tags: ['ubisoft', 'uplay', 'offline', 'firewall'],
    keywords: [
      'ubisoft',
      'uplay',
      'ubi offline',
      'ubisoft offline',
      'ubisoft connect',
      'offline locker',
    ],
    sitePath: SITE_PATHS.faq,
    discordChannel: DISCORD_CHANNELS.ubisoftOffline,
    body: [
      'Block Ubisoft Connect from the internet to play offline.',
      '**Method 1:** Ubisoft Offline Locker (one-click firewall block) — see site FAQ / 🔵 | ubisoft-offline.',
      '**Method 2:** Manually block `UplayWebCore.exe` in Windows Firewall — video on site FAQ.',
      '**Method 3:** Unplug internet / disable Wi-Fi.',
      'Also disable Ubisoft cloud saves.',
      `Full guide: ${siteLink(SITE_PATHS.faq)}`,
    ].join('\n'),
  },
  {
    id: 'steam-offline',
    title: 'Steam offline mode',
    tier: 'A',
    tags: ['steam', 'offline', 'play'],
    keywords: [
      'steam offline',
      'go offline',
      'play offline',
      'steam without internet',
      'offline mode',
    ],
    sitePath: SITE_PATHS.faq,
    discordChannel: DISCORD_CHANNELS.steamOffline,
    body: [
      'After activating on **My Games**, log into Steam with the shared account.',
      'Use **Steam → Go Offline** so the account is not used online by multiple people.',
      'Disable **Steam Cloud** for the game to protect personal saves.',
      'Steam Guard codes are only on the website My Games page — never in Discord.',
      'See 🎮 | steam-offline and 🔑 | how-to-activate.',
    ].join('\n'),
  },
  {
    id: 'how-to-activate',
    title: 'How to activate',
    tier: 'A',
    tags: ['activation', 'credentials', 'my-games'],
    keywords: [
      'activat',
      'how to play',
      'how do i play',
      'get credentials',
      'start playing',
      'my games',
    ],
    sitePath: SITE_PATHS.myGames,
    discordChannel: DISCORD_CHANNELS.howToActivate,
    body: [
      '1. Buy on the website shop.',
      `2. Open **My Games**: ${siteLink(SITE_PATHS.myGames)}`,
      '3. Enter your license key or pick from your account.',
      '4. Select the game, then view credentials and live 2FA on the site.',
      'Never share passwords or Steam Guard codes in Discord.',
    ].join('\n'),
  },
  {
    id: 'where-to-buy',
    title: 'Where to buy / website',
    tier: 'A',
    tags: ['shop', 'buy', 'purchase'],
    keywords: ['buy', 'shop', 'website', 'price', 'purchase', 'how much'],
    sitePath: SITE_PATHS.shop,
    discordChannel: DISCORD_CHANNELS.website,
    body: [
      `Purchase games on the official store: ${siteLink(SITE_PATHS.shop)}`,
      'Discord is for support and announcements — not checkout.',
    ].join('\n'),
  },
  {
    id: 'steam-guard-location',
    title: 'Where to get Steam Guard / 2FA code',
    tier: 'A',
    tags: ['steam', 'guard', '2fa', 'totp'],
    keywords: [
      'steam guard',
      'guard code',
      '2fa',
      'two factor',
      'totp',
      'authentication code',
      'where is the code',
    ],
    sitePath: SITE_PATHS.myGames,
    body: [
      'Steam Guard codes appear **only on the website My Games page** after you sign in and activate.',
      'We never send 2FA codes in Discord.',
      `Go to: ${siteLink(SITE_PATHS.myGames)}`,
    ].join('\n'),
  },
  {
    id: 'steam-guard-cooldown',
    title: 'Steam Guard cooldown',
    tier: 'A',
    tags: ['steam', 'guard', 'cooldown', 'wait'],
    keywords: [
      'cooldown',
      'try again',
      'wait',
      'code not working',
      '429',
      'locked',
      'minutes',
      'seconds',
    ],
    sitePath: SITE_PATHS.myGames,
    body: [
      `Shared Steam accounts use a **${COOLDOWN_MINUTES}-minute cooldown** between guard code requests from different licenses.`,
      'If you see "try again in X seconds", wait — another player may have just requested a code.',
      'The **same license** can refresh its code during cooldown; other licenses must wait.',
      `Request codes only on: ${siteLink(SITE_PATHS.myGames)}`,
    ].join('\n'),
  },
  {
    id: 'sign-in-required',
    title: 'Sign in required for credentials',
    tier: 'A',
    tags: ['sign in', 'login', 'clerk', 'credentials'],
    keywords: [
      'sign in',
      'signin',
      'log in',
      'login',
      'cant see password',
      'cannot see password',
      'need to sign',
      '401',
    ],
    sitePath: SITE_PATHS.myGames,
    body: [
      'You must **sign in on the website** to view Steam credentials and guard codes.',
      'Use the same email as your purchase when possible.',
      `Sign in at: ${siteLink(SITE_PATHS.myGames)}`,
    ].join('\n'),
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    tier: 'A',
    tags: ['subscription', 'catalogue'],
    keywords: ['subscription', 'subscribe', 'monthly', 'catalogue', 'catalog'],
    sitePath: SITE_PATHS.subscriptions,
    body: [
      'Subscription plans give access to a rotating catalogue of games.',
      `View plans: ${siteLink(SITE_PATHS.subscriptions)}`,
      'After subscribing, open **My Games** to pick and activate titles.',
      'Games marked "to replace" may be excluded from subscription access temporarily.',
    ].join('\n'),
  },
  {
    id: 'sold-out',
    title: 'Game sold out',
    tier: 'A',
    tags: ['sold out', 'stock', 'checkout'],
    keywords: ['sold out', 'out of stock', 'unavailable', 'cant checkout', "can't checkout"],
    sitePath: SITE_PATHS.shop,
    discordChannel: DISCORD_CHANNELS.announcements,
    body: [
      'If a game shows **sold out**, no accounts are available right now.',
      'Check back later or watch 📢 | announcements and 🆕 | new-games for restocks.',
      `Browse catalog: ${siteLink(SITE_PATHS.shop)}`,
    ].join('\n'),
  },
  {
    id: 'checkout-success',
    title: 'After purchase / checkout',
    tier: 'A',
    tags: ['checkout', 'purchase', 'order'],
    keywords: [
      'just bought',
      'after purchase',
      'checkout success',
      'paid',
      'payment success',
      'where is my game',
    ],
    sitePath: SITE_PATHS.myGames,
    body: [
      'After a successful purchase, open **My Games** — your license should appear there.',
      'If signed in, you may also see licenses under your account without re-entering the key.',
      `Activate here: ${siteLink(SITE_PATHS.myGames)}`,
      'If nothing appears after 10 minutes, open 🎫 | tickets with your order email.',
    ].join('\n'),
  },
  {
    id: 'wrong-credentials',
    title: 'Wrong game or credentials not working',
    tier: 'B',
    tags: ['ticket', 'wrong game', 'broken'],
    keywords: [
      'wrong game',
      'wrong account',
      'credentials dont work',
      "credentials don't work",
      'doesnt work',
      "doesn't work",
      'not working',
      'invalid password',
      'cant login',
      "can't login",
      'cannot login',
    ],
    sitePath: SITE_PATHS.contact,
    discordChannel: DISCORD_CHANNELS.tickets,
    body: [
      'Open a thread in 🎫 | tickets with:',
      '• Purchase email',
      '• Game title',
      '• What error you see',
      '**Do not post passwords or Steam Guard codes.**',
    ].join('\n'),
  },
  {
    id: 'payment-no-license',
    title: 'Paid but no license received',
    tier: 'B',
    tags: ['payment', 'license', 'missing'],
    keywords: [
      'paid but',
      'no license',
      'no key',
      'payment succeeded',
      'charged but',
      'stripe',
      'missing license',
    ],
    sitePath: SITE_PATHS.contact,
    discordChannel: DISCORD_CHANNELS.tickets,
    body: [
      'Wait a few minutes and refresh **My Games** while signed in.',
      'If still missing, open 🎫 | tickets with purchase email and approximate time.',
      'Staff can look up the order — never share card numbers in Discord.',
    ].join('\n'),
  },
  {
    id: 'technical-edge',
    title: 'Antivirus / firewall / launcher issues',
    tier: 'B',
    tags: ['technical', 'antivirus', 'eac'],
    keywords: [
      'antivirus',
      'windows defender',
      'firewall',
      'eac',
      'easy anti cheat',
      'launcher',
      'crash',
      'error code',
    ],
    sitePath: SITE_PATHS.faq,
    discordChannel: DISCORD_CHANNELS.tickets,
    body: [
      'Try: disable cloud saves, run launcher offline, whitelist game folder in antivirus.',
      'For Ubisoft/Steam offline steps, see site FAQ and guide channels.',
      'If the issue is account-specific, open 🎫 | tickets with details.',
    ].join('\n'),
  },
] as const;

export function knowledgeAsPromptBlock(docs: readonly KnowledgeDoc[]): string {
  return docs
    .map((doc) => `### ${doc.title} [${doc.id}]\n${doc.body}`)
    .join('\n\n');
}

export function getDocById(id: string): KnowledgeDoc | undefined {
  return KNOWLEDGE_DOCS.find((d) => d.id === id);
}

/** @deprecated Use retrieveKnowledge — kept for backward-compatible tests */
export function matchKnowledge(question: string): KnowledgeDoc | null {
  const top = retrieveKnowledge(question, 1);
  return top[0] ?? null;
}

export function formatDocReply(doc: KnowledgeDoc): string {
  const parts = [`**${doc.title}**`, doc.body];
  const links = formatIntentLinks(doc.id);
  if (links) {
    parts.push(`\n${links}`);
  } else if (doc.sitePath) {
    parts.push(`\n**Next step:** ${siteLink(doc.sitePath)}`);
  }
  return parts.join('\n');
}

export { getSiteUrl };
