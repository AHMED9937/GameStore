import { Container, Heading, Text } from '@gamestore/shared/ui';
import type { FaqUbisoftSettings } from '@gamestore/web/data-access';
import { FAQ_SUBTITLE } from './faq.constants';
import { FaqAccordion } from './components/faq-accordion';
import { FaqContactCta } from './components/faq-contact-cta';
import styles from './components/section.module.css';

export type FaqPageProps = {
  ubisoftSettings: FaqUbisoftSettings;
};

export function FaqPage({ ubisoftSettings }: FaqPageProps) {
  return (
    <>
      <section className={styles.section}>
        <Container>
          <Heading level="h1">FAQ</Heading>
          <Text tone="muted" className={styles.subtitle}>
            {FAQ_SUBTITLE}
          </Text>
        </Container>
      </section>
      <FaqAccordion ubisoftSettings={ubisoftSettings} />
      <FaqContactCta />
    </>
  );
}
