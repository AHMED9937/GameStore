export const DISCORD_EMBED_COLOR_AVAILABLE = 0x57f287;
export const DISCORD_EMBED_COLOR_SOLD_OUT = 0xfee75c;

export const DISCORD_EMBED_HEX_AVAILABLE = '#57f287';
export const DISCORD_EMBED_HEX_SOLD_OUT = '#fee75c';

export type DiscordAnnouncementGameInput = {
  title: string;
  slug: string;
  platform: string;
  price: string;
  coverUrl?: string | null;
  soldOut?: boolean;
  announceDescription?: string | null;
};

export type DiscordAnnouncementEmbedField = {
  name: string;
  value: string;
  inline: boolean;
};

export type DiscordAnnouncementEmbed = {
  title: string;
  url: string;
  description: string;
  color: number;
  fields: DiscordAnnouncementEmbedField[];
  footer: { text: string };
  imageUrl?: string;
};

export const DISCORD_SHOP_PATH = '/shop';

export function resolveDiscordAnnouncementDescription(
  announceDescription: string | null | undefined,
  siteUrl: string,
): string {
  const trimmed = announceDescription?.trim();
  if (trimmed) {
    return trimmed;
  }
  const baseUrl = siteUrl.replace(/\/$/, '');
  return `Now available on ${baseUrl}${DISCORD_SHOP_PATH}`;
}

export function buildDiscordAnnouncementEmbed(
  game: DiscordAnnouncementGameInput,
  options: { siteUrl: string },
): DiscordAnnouncementEmbed {
  const siteUrl = options.siteUrl.replace(/\/$/, '');
  const gameUrl = `${siteUrl}/games/${game.slug}`;
  const soldOut = game.soldOut === true;
  const description = resolveDiscordAnnouncementDescription(
    game.announceDescription,
    siteUrl,
  );

  const fields: DiscordAnnouncementEmbedField[] = [
    { name: 'Platform', value: game.platform, inline: true },
    { name: 'Price', value: game.price, inline: true },
  ];
  if (soldOut) {
    fields.push({ name: 'Status', value: 'Sold out', inline: true });
  }

  return {
    title: game.title,
    url: gameUrl,
    description,
    color: soldOut ? DISCORD_EMBED_COLOR_SOLD_OUT : DISCORD_EMBED_COLOR_AVAILABLE,
    fields,
    footer: {
      text: soldOut ? 'Currently sold out' : 'New game published',
    },
    ...(game.coverUrl ? { imageUrl: game.coverUrl } : {}),
  };
}

export function discordEmbedToApiFormat(
  embed: DiscordAnnouncementEmbed,
): Record<string, unknown> {
  return {
    title: embed.title,
    url: embed.url,
    description: embed.description,
    color: embed.color,
    fields: embed.fields,
    footer: embed.footer,
    ...(embed.imageUrl ? { image: { url: embed.imageUrl } } : {}),
  };
}
