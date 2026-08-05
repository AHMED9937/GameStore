'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, Heading, Input, Text, Textarea } from '@gamestore/shared/ui';
import styles from './section.module.css';

const LICENSE_RECOVERY_MESSAGE =
  'I would like to recover my license(s). The email address used for my purchase is:\n\n';

export function ContactForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('topic') === 'license-recovery') {
      setMessage(LICENSE_RECOVERY_MESSAGE);
    }
  }, [searchParams]);

  return (
    <Card className={styles.panel}>
      <Heading level="h2">Send us a message</Heading>
      <Text tone="muted" className={styles.formLead}>
        Questions, license recovery, or setup help — we&apos;ll get back to you by email.
      </Text>
      <form
        className={styles.formStack}
        onSubmit={(event) => event.preventDefault()}
      >
        <Input placeholder="Your name" aria-label="Name" />
        <Input type="email" placeholder="Your email" aria-label="Email" />
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="How can we help?"
          aria-label="Message"
          rows={6}
        />
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
      <Heading level="h2">Other ways to reach us</Heading>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        support@offlinegamenia.com
      </Text>
      <Text tone="dim" style={{ marginTop: '0.5rem' }}>
        Join our Discord community for faster help from staff and other players.
      </Text>
    </Card>
  );
}
