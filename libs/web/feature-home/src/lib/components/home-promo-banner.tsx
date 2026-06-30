import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export function HomePromoBanner() {
  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h2" style={{ marginBottom: '1.5rem' }}>
          Join The Pass
        </Heading>
        <div className={styles.twoCol}>
          <Card className={styles.panel}>
            <Heading level="h3">Monthly Access</Heading>
            <Text tone="muted" style={{ marginTop: '0.5rem' }}>
              Perfect for trying out the latest releases.
            </Text>
            <Text tone="accent" style={{ marginTop: '1rem' }}>
              Subscriptions — pricing wired in a later phase.
            </Text>
          </Card>
          <Card className={styles.panel}>
            <Heading level="h3">Annual Membership</Heading>
            <Text tone="muted" style={{ marginTop: '0.5rem' }}>
              Best value for unlimited access all year.
            </Text>
            <Text tone="accent" style={{ marginTop: '1rem' }}>
              Subscriptions — pricing wired in a later phase.
            </Text>
          </Card>
        </div>
      </Container>
    </section>
  );
}
