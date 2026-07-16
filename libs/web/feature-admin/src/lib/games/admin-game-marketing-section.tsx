'use client';

import { useState } from 'react';
import { Button, EmptyState, Text } from '@gamestore/shared/ui';
import type { AdminGameDiscount } from '@gamestore/web/data-access';
import {
  AdminGameDiscordPanel,
  type AdminGameDiscordPanelProps,
} from './admin-game-discord-panel';
import { AdminGameDiscountPanel } from './admin-game-discount-panel';
import styles from './games.module.css';

export type MarketingPlatformId = 'discord' | 'discount' | 'reddit';

const MARKETING_PLATFORMS: {
  id: MarketingPlatformId;
  label: string;
  enabled: boolean;
}[] = [
  { id: 'discord', label: 'Discord', enabled: true },
  { id: 'discount', label: 'Discount', enabled: true },
  { id: 'reddit', label: 'Reddit', enabled: false },
];

export type AdminGameMarketingSectionProps = AdminGameDiscordPanelProps & {
  gameId: string;
  discount: AdminGameDiscount | null;
  onDiscountChange?: (discount: AdminGameDiscount | null) => void;
};

export function AdminGameMarketingSection({
  gameId,
  discount,
  onDiscountChange,
  ...discordProps
}: AdminGameMarketingSectionProps) {
  const [activePlatform, setActivePlatform] =
    useState<MarketingPlatformId>('discord');

  return (
    <section
      className={styles.marketingSection}
      data-testid="admin-game-marketing-section"
      aria-labelledby="admin-game-marketing-heading"
    >
      <h3 id="admin-game-marketing-heading" className={styles.marketingHeading}>
        Marketing
      </h3>
      <Text tone="muted">
        Manage Discord announcements and limited-time discounts. Saving Discord
        while published syncs automatically; discounts save from their own panel.
      </Text>
      <div
        className={styles.marketingPlatformBar}
        role="tablist"
        aria-label="Marketing platforms"
      >
        {MARKETING_PLATFORMS.map((platform) => (
          <Button
            key={platform.id}
            type="button"
            variant={activePlatform === platform.id ? 'primary' : 'secondary'}
            disabled={!platform.enabled}
            onClick={() => {
              if (platform.enabled) {
                setActivePlatform(platform.id);
              }
            }}
            data-testid={`admin-game-marketing-platform-${platform.id}`}
          >
            {platform.label}
            {!platform.enabled ? ' (coming soon)' : ''}
          </Button>
        ))}
      </div>
      {activePlatform === 'discord' ? (
        <AdminGameDiscordPanel {...discordProps} />
      ) : null}
      {activePlatform === 'discount' ? (
        <AdminGameDiscountPanel
          gameId={gameId}
          priceBase={discordProps.preview.priceBase}
          discount={discount}
          disabled={discordProps.disabled}
          onDiscountChange={onDiscountChange}
        />
      ) : null}
      {activePlatform === 'reddit' ? (
        <div
          className={styles.marketingPlatformComingSoon}
          data-testid="admin-game-marketing-reddit"
        >
          <EmptyState
            title="Reddit"
            message="Reddit announcements are not available yet. Check back in a future release."
          />
        </div>
      ) : null}
    </section>
  );
}
