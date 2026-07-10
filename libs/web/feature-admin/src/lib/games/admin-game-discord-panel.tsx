'use client';

import {
  DISCORD_EMBED_HEX_AVAILABLE,
  DISCORD_EMBED_HEX_SOLD_OUT,
  buildDiscordAnnouncementEmbed,
  resolveDiscordAnnouncementDescription,
} from '@gamestore/shared/marketing';
import { Badge, Card, Text, Textarea } from '@gamestore/shared/ui';
import type { AdminGameDiscord } from '@gamestore/web/data-access';
import styles from './games.module.css';

export type AdminGameDiscordPreview = {
  title: string;
  slug: string;
  priceBase: string;
  platform: string;
  soldOut: boolean;
  coverImage: string;
};

export type AdminGameDiscordPanelProps = {
  discord: AdminGameDiscord;
  announceDescription: string;
  preview: AdminGameDiscordPreview;
  onAnnounceDescriptionChange: (value: string) => void;
  disabled?: boolean;
};

function resolveMarketingSiteUrl(): string {
  return (
    process.env['NEXT_PUBLIC_SITE_URL']?.trim() ||
    process.env['SITE_URL']?.trim() ||
    'https://example.com'
  ).replace(/\/$/, '');
}

function discordStatusLabel(discord: AdminGameDiscord): string {
  if (!discord.configured) {
    return 'Webhook not configured';
  }
  if (discord.posted) {
    return 'Posted to Discord';
  }
  return 'Not posted';
}

function discordStatusVariant(
  discord: AdminGameDiscord,
): 'default' | 'success' | 'accent' {
  if (!discord.configured) {
    return 'accent';
  }
  if (discord.posted) {
    return 'success';
  }
  return 'default';
}

export function AdminGameDiscordPanel({
  discord,
  announceDescription,
  preview,
  onAnnounceDescriptionChange,
  disabled = false,
}: AdminGameDiscordPanelProps) {
  const siteUrl = resolveMarketingSiteUrl();
  const editableDescription = resolveDiscordAnnouncementDescription(
    announceDescription,
    siteUrl,
  );
  const embed = buildDiscordAnnouncementEmbed(
    {
      title: preview.title,
      slug: preview.slug,
      platform: preview.platform,
      price: preview.priceBase,
      coverUrl: preview.coverImage || null,
      soldOut: preview.soldOut,
      announceDescription: editableDescription,
    },
    { siteUrl },
  );
  const borderColor = preview.soldOut
    ? DISCORD_EMBED_HEX_SOLD_OUT
    : DISCORD_EMBED_HEX_AVAILABLE;

  return (
    <Card
      className={styles.marketingPlatformPanel}
      data-testid="admin-game-discord-panel"
      aria-labelledby="admin-game-discord-heading"
    >
      <div className={styles.discordPanelHeader}>
        <h4 id="admin-game-discord-heading" className={styles.discordHeading}>
          Discord announcement
        </h4>
        <Badge variant={discordStatusVariant(discord)}>
          {discordStatusLabel(discord)}
        </Badge>
      </div>
      <Text tone="muted">
        Saving while published updates the Discord post automatically.
      </Text>
      <label className={styles.discordField}>
        <Text>Announcement text</Text>
        <Textarea
          rows={4}
          value={editableDescription}
          disabled={disabled}
          onChange={(event) => onAnnounceDescriptionChange(event.target.value)}
          data-testid="admin-game-discord-description"
        />
      </label>
      <div className={styles.discordPreview} data-testid="admin-game-discord-preview">
        <Text tone="muted">Preview</Text>
        <div
          className={styles.discordPreviewCard}
          style={{ borderLeftColor: borderColor }}
        >
          <p className={styles.discordPreviewTitle}>{embed.title}</p>
          <Text tone="muted">{embed.description}</Text>
          <div className={styles.discordPreviewMeta}>
            {embed.fields.map((field) => (
              <Text key={field.name} tone="muted">
                {field.name}: {field.value}
              </Text>
            ))}
          </div>
          {embed.imageUrl ? (
            <img
              className={styles.discordPreviewImage}
              src={embed.imageUrl}
              alt=""
              data-testid="admin-game-discord-preview-image"
            />
          ) : null}
          <Text tone="dim" className={styles.discordPreviewFooter}>
            {embed.footer.text}
          </Text>
        </div>
      </div>
    </Card>
  );
}
