export function getSiteUrl(): string {
  return (
    process.env['NEXT_PUBLIC_SITE_URL']?.trim().replace(/\/$/, '') ||
    'http://localhost:3000'
  );
}

export function siteLink(path: string): string {
  const base = getSiteUrl();
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

export const SITE_PATHS = {
  myGames: '/my-games',
  faq: '/faq',
  shop: '/shop',
  contact: '/contact',
  licenseRecovery: '/contact?topic=license-recovery',
  subscriptions: '/subscriptions',
  checkout: '/checkout',
} as const;

export const DISCORD_CHANNELS = {
  generalHelp: '❓ | general-help',
  tickets: '🎫 | tickets',
  howToActivate: '🔑 | how-to-activate',
  ubisoftOffline: '🔵 | ubisoft-offline',
  steamOffline: '🎮 | steam-offline',
  website: '🌐 | website',
  announcements: '📢 | announcements',
  newGames: '🆕 | new-games',
} as const;

export const TICKET_TEMPLATE = [
  '**Ticket template** (do not paste passwords or Steam Guard codes):',
  '• Purchase email:',
  '• Game title:',
  '• What you tried:',
  '• Screenshot of the error (optional)',
].join('\n');

let cachedTicketsChannelId: string | null = null;

export function setTicketsChannelId(id: string | null): void {
  cachedTicketsChannelId = id;
}

export function getTicketsChannelId(): string | null {
  return (
    process.env['DISCORD_TICKETS_CHANNEL_ID']?.trim() ||
    cachedTicketsChannelId
  );
}

export function ticketChannelMention(channelId?: string | null): string {
  const id = channelId ?? getTicketsChannelId();
  return id ? `<#${id}>` : '🎫 | tickets';
}

export function ticketOpenHint(channelId?: string | null): string {
  const mention = ticketChannelMention(channelId);
  return `Open a private ticket in ${mention} or run \`/ticket\` for the template.`;
}

export function isLocalSiteUrl(): boolean {
  const url = getSiteUrl().toLowerCase();
  return url.includes('localhost') || url.includes('127.0.0.1');
}
