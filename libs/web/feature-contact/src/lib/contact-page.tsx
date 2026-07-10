import { Container, Heading } from '@gamestore/shared/ui';
import { Suspense } from 'react';
import { ContactForm, ContactInfo } from './components/contact-sections';
import styles from './components/section.module.css';

export function ContactPage() {
  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Contact</Heading>
        <div className={styles.twoCol} style={{ marginTop: '1.5rem' }}>
          <Suspense fallback={<div className={styles.panel}>Loading form…</div>}>
            <ContactForm />
          </Suspense>
          <ContactInfo />
        </div>
      </Container>
    </section>
  );
}
