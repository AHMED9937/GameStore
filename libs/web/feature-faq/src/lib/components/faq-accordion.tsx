'use client';

import { useId, useState } from 'react';
import { Container, Heading } from '@gamestore/shared/ui';
import type { FaqUbisoftSettings } from '@gamestore/web/data-access';
import { FAQ_ITEMS } from '../faq.constants';
import { FaqAnswerDefault } from './faq-answer-default';
import { FaqLicenseAnswer } from './faq-license-answer';
import { FaqUbisoftAnswer } from './faq-ubisoft-answer';
import styles from './section.module.css';

export type FaqAccordionProps = {
  ubisoftSettings: FaqUbisoftSettings;
};

export function FaqAccordion({ ubisoftSettings }: FaqAccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string>(FAQ_ITEMS[0]?.id ?? '');

  return (
    <section className={styles.accordionSection}>
      <Container>
        <div className={styles.accordion}>
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            const panelId = `${baseId}-${item.id}-panel`;
            const buttonId = `${baseId}-${item.id}-button`;

            return (
              <article key={item.id} className={styles.accordionItem}>
                <button
                  type="button"
                  id={buttonId}
                  className={styles.accordionTrigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? '' : item.id)}
                >
                  <Heading level="h3" className={styles.accordionQuestion}>
                    {item.question}
                  </Heading>
                  <span
                    className={[
                      styles.accordionChevron,
                      isOpen ? styles.accordionChevronOpen : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-hidden
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={[
                    styles.accordionPanel,
                    isOpen ? styles.accordionPanelOpen : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  hidden={!isOpen}
                >
                  {item.variant === 'ubisoft' ? (
                    <FaqUbisoftAnswer settings={ubisoftSettings} />
                  ) : item.variant === 'license' ? (
                    <FaqLicenseAnswer item={item} />
                  ) : (
                    <FaqAnswerDefault item={item} />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
