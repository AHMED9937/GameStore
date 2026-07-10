import { Text } from '@gamestore/shared/ui';
import type { FaqItem } from '../faq.constants';
import styles from './section.module.css';

export type FaqAnswerDefaultProps = {
  item: FaqItem;
};

export function FaqAnswerDefault({ item }: FaqAnswerDefaultProps) {
  return (
    <div className={styles.faqAnswer}>
      {item.paragraphs?.map((paragraph) => (
        <Text key={paragraph} tone="muted" className={styles.faqParagraph}>
          {paragraph}
        </Text>
      ))}

      {item.bullets && item.bullets.length > 0 ? (
        <ul className={styles.faqList}>
          {item.bullets.map((bullet) => (
            <li key={bullet}>
              <Text tone="muted">{bullet}</Text>
            </li>
          ))}
        </ul>
      ) : null}

      {item.callout ? (
        <div className={styles.faqCallout} role="note">
          <Text className={styles.faqCalloutTitle}>{item.callout.title}</Text>
          <Text tone="muted" className={styles.faqCalloutBody}>
            {item.callout.body}
          </Text>
        </div>
      ) : null}
    </div>
  );
}
