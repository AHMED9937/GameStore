'use client';

import { Button, Card, Container, Heading, Input, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export function ContactForm() {
  return (
    <Card className={styles.panel}>
      <Heading level="h2">ContactForm</Heading>
      <form className={styles.formStack} style={{ marginTop: '1rem' }} onSubmit={(e) => e.preventDefault()}>
        <Input placeholder="Your name" aria-label="Name" />
        <Input type="email" placeholder="Your email" aria-label="Email" />
        <Input placeholder="Message" aria-label="Message" />
        <Button type="submit" variant="primary">
          Send message
        </Button>
      </form>
    </Card>
  );
}

export function ContactInfo() {
  return (
    <Card className={styles.panel}>
      <Heading level="h2">ContactInfo</Heading>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        support@gamestore.example
      </Text>
      <Text tone="dim" style={{ marginTop: '0.5rem' }}>
        Response times vary — full support flow in a later phase.
      </Text>
    </Card>
  );
}
