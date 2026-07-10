import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAnnouncementBody,
  DiscordNotifyService,
  parseWebhookUrl,
} from './discord-notify.service';

const WEBHOOK_URL =
  'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz';

describe('parseWebhookUrl', () => {
  it('parses a standard Discord webhook URL', () => {
    expect(parseWebhookUrl(WEBHOOK_URL)).toEqual({
      baseUrl: 'https://discord.com/api',
      webhookId: '123456789012345678',
      token: 'abcdefghijklmnopqrstuvwxyz',
    });
  });

  it('returns null for invalid URLs', () => {
    expect(parseWebhookUrl('https://example.com/not-a-webhook')).toBeNull();
  });
});

describe('buildAnnouncementBody', () => {
  beforeEach(() => {
    process.env['NEXT_PUBLIC_SITE_URL'] = 'https://store.example';
    delete process.env['DISCORD_NEW_GAMES_ROLE_ID'];
  });

  it('builds available embed without role ping by default', () => {
    const body = buildAnnouncementBody({
      title: 'Demo Game',
      slug: 'demo-game',
      coverUrl: 'https://cdn.example/cover.jpg',
      platform: 'steam',
      price: '9.99',
    });

    expect(body.content).toBeUndefined();
    expect(body.embeds[0]).toMatchObject({
      title: 'Demo Game',
      url: 'https://store.example/games/demo-game',
      description: 'Now available on https://store.example/shop',
      color: 0x57f287,
      footer: { text: 'New game published' },
    });
  });

  it('builds sold-out embed with status field', () => {
    const body = buildAnnouncementBody({
      title: 'Demo Game',
      slug: 'demo-game',
      coverUrl: null,
      platform: 'steam',
      price: '9.99',
      soldOut: true,
    });

    expect(body.embeds[0]).toMatchObject({
      color: 0xfee75c,
      footer: { text: 'Currently sold out' },
    });
    const fields = body.embeds[0]?.fields as Array<{ name: string; value: string }>;
    expect(fields.some((f) => f.name === 'Status' && f.value === 'Sold out')).toBe(true);
  });

  it('uses custom announce description when provided', () => {
    const body = buildAnnouncementBody({
      title: 'Demo',
      slug: 'demo',
      coverUrl: null,
      platform: 'steam',
      price: '1.00',
      announceDescription: 'Launch week special!',
    });

    expect(body.embeds[0]?.description).toBe('Launch week special!');
  });

  it('includes role ping when requested', () => {
    process.env['DISCORD_NEW_GAMES_ROLE_ID'] = 'role-123';
    const body = buildAnnouncementBody(
      {
        title: 'Demo',
        slug: 'demo',
        coverUrl: null,
        platform: 'steam',
        price: '1.00',
      },
      { includeRolePing: true },
    );

    expect(body.content).toBe('<@&role-123>');
    expect(body.allowed_mentions).toEqual({ roles: ['role-123'] });
  });
});

describe('DiscordNotifyService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env['DISCORD_NEW_GAMES_WEBHOOK_URL'];
    delete process.env['DISCORD_NEW_GAMES_ROLE_ID'];
    delete process.env['NEXT_PUBLIC_SITE_URL'];
  });

  it('no-ops when webhook URL is unset', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const service = new DiscordNotifyService();
    const id = await service.publishGameAnnouncement({
      title: 'Demo',
      slug: 'demo',
      coverUrl: null,
      platform: 'steam',
      price: '9.99',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(id).toBeNull();
  });

  it('posts embed with wait=true and returns message id', async () => {
    process.env['DISCORD_NEW_GAMES_WEBHOOK_URL'] = WEBHOOK_URL;
    process.env['DISCORD_NEW_GAMES_ROLE_ID'] = 'role-123';
    process.env['NEXT_PUBLIC_SITE_URL'] = 'https://store.example';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'msg-123' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new DiscordNotifyService();
    const id = await service.publishGameAnnouncement({
      title: 'Demo Game',
      slug: 'demo-game',
      coverUrl: 'https://cdn.example/cover.jpg',
      platform: 'steam',
      price: '9.99',
    });

    expect(id).toBe('msg-123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz?wait=true',
    );
    const body = JSON.parse(String(init.body)) as {
      content: string;
      embeds: Array<{ title: string; url: string; image?: { url: string } }>;
    };
    expect(body.content).toBe('<@&role-123>');
    expect(body.embeds[0]?.title).toBe('Demo Game');
    expect(body.embeds[0]?.url).toBe('https://store.example/games/demo-game');
    expect(body.embeds[0]?.image?.url).toBe('https://cdn.example/cover.jpg');
  });

  it('patches an existing announcement', async () => {
    process.env['DISCORD_NEW_GAMES_WEBHOOK_URL'] = WEBHOOK_URL;
    process.env['NEXT_PUBLIC_SITE_URL'] = 'https://store.example';

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const service = new DiscordNotifyService();
    await service.updateGameAnnouncement('msg-456', {
      title: 'Updated',
      slug: 'updated',
      coverUrl: null,
      platform: 'steam',
      price: '19.99',
      soldOut: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz/messages/msg-456',
    );
    expect(init.method).toBe('PATCH');
    const body = JSON.parse(String(init.body)) as {
      embeds: Array<{ color: number }>;
    };
    expect(body.embeds[0]?.color).toBe(0xfee75c);
  });

  it('deletes an announcement', async () => {
    process.env['DISCORD_NEW_GAMES_WEBHOOK_URL'] = WEBHOOK_URL;

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    const service = new DiscordNotifyService();
    const deleted = await service.deleteGameAnnouncement('msg-789');

    expect(deleted).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz/messages/msg-789',
    );
    expect(init.method).toBe('DELETE');
  });

  it('treats 404 on delete as success', async () => {
    process.env['DISCORD_NEW_GAMES_WEBHOOK_URL'] = WEBHOOK_URL;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const service = new DiscordNotifyService();
    await expect(
      service.deleteGameAnnouncement('msg-gone'),
    ).resolves.toBe(true);
  });

  it('does not throw when Discord publish returns an error', async () => {
    process.env['DISCORD_NEW_GAMES_WEBHOOK_URL'] = WEBHOOK_URL;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'fail' }),
    );

    const service = new DiscordNotifyService();
    await expect(
      service.publishGameAnnouncement({
        title: 'Demo',
        slug: 'demo',
        coverUrl: null,
        platform: 'steam',
        price: '1.00',
      }),
    ).resolves.toBeNull();
  });
});
