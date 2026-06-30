import { Container, Heading } from '@gamestore/shared/ui';
import { FaqAccordion, FaqContactCta } from './components/faq-sections';
import styles from './components/section.module.css';

export function FaqPage() {
  return (
    <>
      <section className={styles.section}>
        <Container>
          <Heading level="h1">FAQ</Heading>
        </Container>
      </section>
      <FaqAccordion />
      <FaqContactCta />
    </>
  );
}
