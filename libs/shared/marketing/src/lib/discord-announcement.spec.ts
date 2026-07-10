import { describe, expect, it } from 'vitest';
import {
  DISCORD_EMBED_COLOR_AVAILABLE,
  DISCORD_EMBED_COLOR_SOLD_OUT,
  buildDiscordAnnouncementEmbed,
  discordEmbedToApiFormat,
  resolveDiscordAnnouncementDescription,
} from './discord-announcement';

describe('resolveDiscordAnnouncementDescription', () => {
  it('returns custom text when provided', () => {
    expect(
      resolveDiscordAnnouncementDescription('Launch week!', 'https://store.example'),
    ).toBe('Launch week!');
  });

  it('returns default when empty', () => {
    expect(resolveDiscordAnnouncementDescription('', 'https://store.example')).toBe(
      'Now available on https://store.example/shop',
    );
    expect(resolveDiscordAnnouncementDescription(null, 'https://store.example/')).toBe(
      'Now available on https://store.example/shop',
    );
  });
});

describe('buildDiscordAnnouncementEmbed', () => {
  it('builds available embed with default description', () => {
    const embed = buildDiscordAnnouncementEmbed(
      {
        title: 'Demo Game',
        slug: 'demo-game',
        platform: 'steam',
        price: '9.99',
        coverUrl: 'https://cdn.example/cover.jpg',
      },
      { siteUrl: 'https://store.example' },
    );

    expect(embed).toMatchObject({
      title: 'Demo Game',
      url: 'https://store.example/games/demo-game',
      description: 'Now available on https://store.example/shop',
      color: DISCORD_EMBED_COLOR_AVAILABLE,
      footer: { text: 'New game published' },
      imageUrl: 'https://cdn.example/cover.jpg',
    });
    expect(embed.fields).toEqual([
      { name: 'Platform', value: 'steam', inline: true },
      { name: 'Price', value: '9.99', inline: true },
    ]);
  });

  it('builds sold-out embed with status field and footer', () => {
    const embed = buildDiscordAnnouncementEmbed(
      {
        title: 'Demo Game',
        slug: 'demo-game',
        platform: 'steam',
        price: '9.99',
        soldOut: true,
      },
      { siteUrl: 'https://store.example/' },
    );

    expect(embed.color).toBe(DISCORD_EMBED_COLOR_SOLD_OUT);
    expect(embed.footer).toEqual({ text: 'Currently sold out' });
    expect(embed.fields.some((f) => f.name === 'Status' && f.value === 'Sold out')).toBe(
      true,
    );
  });

  it('uses custom announce description when provided', () => {
    const embed = buildDiscordAnnouncementEmbed(
      {
        title: 'Demo',
        slug: 'demo',
        platform: 'steam',
        price: '1.00',
        announceDescription: 'Launch week special!',
      },
      { siteUrl: 'https://store.example' },
    );

    expect(embed.description).toBe('Launch week special!');
  });
});

describe('discordEmbedToApiFormat', () => {
  it('maps embed to Discord API shape', () => {
    const embed = buildDiscordAnnouncementEmbed(
      {
        title: 'Demo',
        slug: 'demo',
        platform: 'steam',
        price: '1.00',
        coverUrl: 'https://cdn.example/cover.jpg',
      },
      { siteUrl: 'https://store.example' },
    );

    expect(discordEmbedToApiFormat(embed)).toMatchObject({
      title: 'Demo',
      url: 'https://store.example/games/demo',
      image: { url: 'https://cdn.example/cover.jpg' },
    });
  });
});
