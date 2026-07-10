'use client';

import { SkeletonText } from '@gamestore/shared/ui';
import { useSteamGuardCode } from './use-steam-guard-code';
import styles from './steam-access.module.css';

export type SteamGuardLiveCodeProps = {
  licenseKey: string;
};

export function SteamGuardLiveCode({ licenseKey }: SteamGuardLiveCodeProps) {
  const { code, expiresInSeconds, loading, error } = useSteamGuardCode(licenseKey);

  return (
    <div className={styles.guardSection} data-testid="steam-guard-live">
      <p className={styles.guardLabel}>Two-Factor Authentication Code</p>
      {loading && !code ? (
        <div className={styles.guardMeta} aria-live="polite">
          <SkeletonText width={120} />
        </div>
      ) : (
        <p className={styles.guardCode} data-testid="steam-guard-code">
          {code ?? '—'}
        </p>
      )}
      {expiresInSeconds !== null && code ? (
        <p className={styles.guardMeta} data-testid="steam-guard-countdown">
          New code in {expiresInSeconds}s
        </p>
      ) : null}
      {error ? <p className={styles.guardError}>{error}</p> : null}
    </div>
  );
}
