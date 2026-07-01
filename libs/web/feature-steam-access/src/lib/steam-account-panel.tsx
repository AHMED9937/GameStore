'use client';

import { useCallback, useState } from 'react';
import { Button } from '@gamestore/shared/ui';
import styles from './steam-access.module.css';

export type SteamAccountPanelProps = {
  gameTitle: string;
  username: string;
  password: string;
  children?: React.ReactNode;
};

export function SteamAccountPanel({
  gameTitle,
  username,
  password,
  children,
}: SteamAccountPanelProps) {
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(
    null,
  );

  const copyValue = useCallback(async (field: 'username' | 'password', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  }, []);

  return (
    <section className={styles.accountPanel} data-testid="steam-account-panel">
      <h2 className={styles.accountHeading}>Steam Account</h2>
      <p className={styles.accountIntro}>
        Here are the details for your Steam account for {gameTitle}. Please keep
        them confidential.
      </p>
      <div className={styles.credentialsBox}>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Plateforme</span>
          <span className={`${styles.fieldValue} ${styles.platformBadge}`}>
            <span className={styles.steamDot} aria-hidden />
            Steam
          </span>
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Username</span>
          <span className={styles.fieldValue} data-testid="steam-username">
            {username}
          </span>
          <Button
            variant="secondary"
            className={styles.copyButton}
            onClick={() => void copyValue('username', username)}
          >
            {copiedField === 'username' ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Password</span>
          <span className={styles.fieldValue} data-testid="steam-password">
            {password}
          </span>
          <Button
            variant="secondary"
            className={styles.copyButton}
            onClick={() => void copyValue('password', password)}
          >
            {copiedField === 'password' ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        {children}
      </div>
    </section>
  );
}
