import Link from 'next/link';
import { Text } from '@gamestore/shared/ui';
import type { FaqUbisoftSettings } from '@gamestore/web/data-access';
import { FaqVideoEmbed } from './faq-video-embed';
import styles from './section.module.css';

export type FaqUbisoftAnswerProps = {
  settings: FaqUbisoftSettings;
};

export function FaqUbisoftAnswer({ settings }: FaqUbisoftAnswerProps) {
  return (
    <div className={styles.faqAnswer}>
      <Text tone="muted" className={styles.faqParagraph}>
        Here&apos;s how to switch Ubisoft Connect to offline mode by blocking its
        connection in the Windows firewall.
      </Text>

      <article className={styles.faqMethod}>
        <Text className={styles.faqMethodTitle}>
          Method 1: Use Ubisoft Offline Locker (Easy &amp; Fast)
        </Text>
        <ul className={styles.faqList}>
          <li>
            <Text tone="muted">
              One-click block/unblock for Ubisoft Connect in Windows Firewall.
            </Text>
          </li>
          <li>
            <Text tone="muted">Saves your settings for quick access.</Text>
          </li>
          <li>
            <Text tone="muted">No manual configuration needed.</Text>
          </li>
        </ul>
        <div className={styles.faqLinkRow}>
          {settings.lockerDownloadUrl ? (
            <a
              href={settings.lockerDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.faqExternalLink}
            >
              Download Ubisoft Offline Locker
            </a>
          ) : (
            <Text tone="dim">Download link coming soon.</Text>
          )}
          {settings.lockerGithubUrl ? (
            <a
              href={settings.lockerGithubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.faqExternalLink}
            >
              View on GitHub
            </a>
          ) : null}
        </div>
        <Text tone="muted" className={styles.faqMethodLead}>
          Full installation video guide:
        </Text>
        <FaqVideoEmbed
          url={settings.method1VideoUrl}
          title="Ubisoft offline locker installation guide"
        />
      </article>

      <article className={styles.faqMethod}>
        <Text className={styles.faqMethodTitle}>
          Method 2: Manually Block via Windows Firewall (No software needed)
        </Text>
        <Text tone="muted" className={styles.faqParagraph}>
          If you prefer a manual setup, follow this step-by-step tutorial to block
          &quot;UplayWebCore.exe&quot; directly in your firewall settings.
        </Text>
        <Text tone="muted" className={styles.faqMethodLead}>
          Full installation video guide:
        </Text>
        <FaqVideoEmbed
          url={settings.method2VideoUrl}
          title="Manual Ubisoft firewall block guide"
        />
      </article>

      <article className={styles.faqMethod}>
        <Text className={styles.faqMethodTitle}>Method 3: Unplug</Text>
        <Text tone="muted" className={styles.faqParagraph}>
          The simplest method is to unplug your Internet cable or disable Wi-Fi to
          go offline.
        </Text>
      </article>
    </div>
  );
}
