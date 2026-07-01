import type { LicenseGameSummary } from '@gamestore/web/data-access';
import { AdditionalInfoPanel } from './additional-info-panel';
import { PurchaseGameCard } from './purchase-game-card';
import { SteamAccountPanel } from './steam-account-panel';
import { SteamGuardLiveCode } from './steam-guard-live-code';
import styles from './steam-access.module.css';

export type SteamAccountLayoutProps = {
  game: LicenseGameSummary;
  username: string;
  password: string;
  licenseKey: string;
  additionalInfo?: string | null;
  coverFallback?: string;
};

export function SteamAccountLayout({
  game,
  username,
  password,
  licenseKey,
  additionalInfo,
  coverFallback,
}: SteamAccountLayoutProps) {
  return (
    <div data-testid="steam-account-layout">
      <div className={styles.layout}>
        <PurchaseGameCard game={game} coverFallback={coverFallback} />
        <SteamAccountPanel
          gameTitle={game.title}
          username={username}
          password={password}
        >
          <SteamGuardLiveCode licenseKey={licenseKey} />
        </SteamAccountPanel>
      </div>
      <AdditionalInfoPanel content={additionalInfo} />
    </div>
  );
}
