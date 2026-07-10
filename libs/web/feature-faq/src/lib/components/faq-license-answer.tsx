import Link from 'next/link';
import { Text } from '@gamestore/shared/ui';
import type { FaqItem } from '../faq.constants';
import styles from './section.module.css';

export type FaqLicenseAnswerProps = {
  item: FaqItem;
};

export function FaqLicenseAnswer({ item }: FaqLicenseAnswerProps) {
  return (
    <div className={styles.faqAnswer}>
      {item.paragraphs?.map((paragraph) => (
        <Text key={paragraph} tone="muted" className={styles.faqParagraph}>
          {paragraph}
        </Text>
      ))}

      <div className={styles.faqActions}>
        <Link
          href="/contact?topic=license-recovery"
          className={styles.faqPrimaryLink}
        >
          Recover my license
        </Link>
      </div>
    </div>
  );
}
