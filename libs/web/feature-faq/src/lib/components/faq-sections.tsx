import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import Link from 'next/link';
import styles from './section.module.css';

const FAQ_ITEMS = [
  {
    question: 'How does offline activation work?',
    answer: 'Shell answer — full FAQ content in a later phase.',
  },
  {
    question: 'Which platforms are supported?',
    answer: 'Steam, Epic, and Ubisoft — details coming soon.',
  },
  {
    question: 'How do I get a Steam Guard code?',
    answer: 'Use the My Games portal after entering your license key.',
  },
] as const;

export function FaqAccordion() {
  return (
    <section>
      <Container>
        {FAQ_ITEMS.map((item) => (
          <Card key={item.question} className={styles.faqItem}>
            <Heading level="h3">{item.question}</Heading>
            <Text tone="muted" style={{ marginTop: '0.5rem' }}>
              {item.answer}
            </Text>
          </Card>
        ))}
      </Container>
    </section>
  );
}

export function FaqContactCta() {
  return (
    <section style={{ paddingBottom: '3rem', paddingTop: '1.5rem' }}>
      <Container>
        <Card className={styles.panel}>
          <Heading level="h3">FaqContactCta</Heading>
          <Text tone="muted" style={{ marginTop: '0.5rem' }}>
            Still have questions?{' '}
            <Link href="/contact" style={{ color: 'var(--color-secondary)' }}>
              Contact us
            </Link>
          </Text>
        </Card>
      </Container>
    </section>
  );
}
