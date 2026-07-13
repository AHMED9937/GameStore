import { Injectable, Logger } from '@nestjs/common';
import { resolveSiteUrl } from '@gamestore/api/stripe';
import {
  buildDiscordAnnouncementEmbed,
  discordEmbedToApiFormat,
} from '@gamestore/shared/marketing';

export type GamePublishedNotifyPayload = {
  title: string;
  slug: string;
  coverUrl: string | null;
  platform: string;
  price: string;
  soldOut?: boolean;
  announceDescription?: string | null;
};

export type ParsedWebhookUrl = {
  webhookId: string;
  token: string;
  baseUrl: string;
};

export function parseWebhookUrl(url: string): ParsedWebhookUrl | null {
  const match = url
    .trim()
    .match(/^(https?:\/\/[^/]+(?:\/[^/]+)*)\/webhooks\/(\d+)\/([^/?#]+)/i);
  if (!match) {
    return null;
  }
  return {
    baseUrl: match[1],
    webhookId: match[2],
    token: match[3],
  };
}

export function buildAnnouncementBody(
  game: GamePublishedNotifyPayload,
  options?: { includeRolePing?: boolean },
): {
  content?: string;
  allowed_mentions: { roles: string[] } | { parse: [] };
  embeds: Array<Record<string, unknown>>;
} {
  const siteUrl = resolveSiteUrl();
  const roleId = process.env['DISCORD_NEW_GAMES_ROLE_ID']?.trim();
  const includeRolePing = options?.includeRolePing === true && Boolean(roleId);
  const embed = buildDiscordAnnouncementEmbed(
    {
      title: game.title,
      slug: game.slug,
      platform: game.platform,
      price: game.price,
      coverUrl: game.coverUrl,
      soldOut: game.soldOut,
      announceDescription: game.announceDescription,
    },
    { siteUrl },
  );

  return {
    ...(includeRolePing ? { content: `<@&${roleId}>` } : {}),
    allowed_mentions: includeRolePing && roleId ? { roles: [roleId] } : { parse: [] },
    embeds: [discordEmbedToApiFormat(embed)],
  };
}

/**
 * D.1 — Discord webhook lifecycle for published game announcements.
 * Missing env or Discord errors must never fail the publish API.
 */
@Injectable()
export class DiscordNotifyService {
  private readonly logger = new Logger(DiscordNotifyService.name);

  isWebhookConfigured(): boolean {
    const webhookUrl = process.env['DISCORD_NEW_GAMES_WEBHOOK_URL']?.trim();
    if (!webhookUrl) {
      return false;
    }
    return parseWebhookUrl(webhookUrl) !== null;
  }

  private getWebhook(): ParsedWebhookUrl | null {
    const webhookUrl = process.env['DISCORD_NEW_GAMES_WEBHOOK_URL']?.trim();
    if (!webhookUrl) {
      return null;
    }
    const parsed = parseWebhookUrl(webhookUrl);
    if (!parsed) {
      this.logger.warn('DISCORD_NEW_GAMES_WEBHOOK_URL is not a valid Discord webhook URL');
      return null;
    }
    return parsed;
  }

  async publishGameAnnouncement(
    game: GamePublishedNotifyPayload,
  ): Promise<string | null> {
    const webhook = this.getWebhook();
    if (!webhook) {
      return null;
    }

    const body = buildAnnouncementBody(game, { includeRolePing: true });
    const url = `${webhook.baseUrl}/webhooks/${webhook.webhookId}/${webhook.token}?wait=true`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(
          `Discord publish failed: ${res.status} ${text.slice(0, 200)}`,
        );
        return null;
      }
      const data = (await res.json()) as { id?: string };
      return data.id ?? null;
    } catch (err) {
      this.logger.warn(
        `Discord publish error: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  async updateGameAnnouncement(
    messageId: string,
    game: GamePublishedNotifyPayload,
  ): Promise<void> {
    const webhook = this.getWebhook();
    if (!webhook) {
      return;
    }

    const body = buildAnnouncementBody(game, { includeRolePing: false });
    const url = `${webhook.baseUrl}/webhooks/${webhook.webhookId}/${webhook.token}/messages/${messageId}`;

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(
          `Discord update failed: ${res.status} ${text.slice(0, 200)}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Discord update error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async deleteGameAnnouncement(messageId: string): Promise<boolean> {
    const webhook = this.getWebhook();
    if (!webhook) {
      return false;
    }

    const url = `${webhook.baseUrl}/webhooks/${webhook.webhookId}/${webhook.token}/messages/${messageId}`;

    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.status === 404) {
        return true;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(
          `Discord delete failed: ${res.status} ${text.slice(0, 200)}`,
        );
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `Discord delete error: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  /** @deprecated Use publishGameAnnouncement */
  async notifyGamePublished(game: GamePublishedNotifyPayload): Promise<void> {
    await this.publishGameAnnouncement(game);
  }
}
