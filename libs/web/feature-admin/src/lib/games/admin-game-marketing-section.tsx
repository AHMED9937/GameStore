'use client';

import { useState } from 'react';
import { Button, EmptyState, Text } from '@gamestore/shared/ui';
import { AdminGameDiscordPanel, type AdminGameDiscordPanelProps } from './admin-game-discord-panel';
import styles from './games.module.css';

export type MarketingPlatformId = 'discord' | 'reddit';

const MARKETING_PLATFORMS: {
  id: MarketingPlatformId;
  label: string;
  enabled: boolean;
}[] = [
  { id: 'discord', label: 'Discord', enabled: true },
  { id: 'reddit', label: 'Reddit', enabled: false },
];

export type AdminGameMarketingSectionProps = AdminGameDiscordPanelProps;

export function AdminGameMarketingSection(props: AdminGameMarketingSectionProps) {
  const [activePlatform, setActivePlatform] = useState<MarketingPlatformId>('discord');

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
        Manage channel-specific announcement copy. Saving while published syncs Discord
        automatically.
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
      {activePlatform === 'discord' ? <AdminGameDiscordPanel {...props} /> : null}
      {activePlatform === 'reddit' ? (
        <div className={styles.marketingPlatformComingSoon} data-testid="admin-game-marketing-reddit">
          <EmptyState
            title="Reddit"
            message="Reddit announcements are not available yet. Check back in a future release."
          />
        </div>
      ) : null}
    </section>
  );
}
