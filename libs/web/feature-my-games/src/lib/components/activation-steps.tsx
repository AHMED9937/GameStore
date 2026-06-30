import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

const STEPS = [
  'Enter your license key',
  'Receive Steam credentials',
  'Request Steam Guard code when prompted',
] as const;

export function ActivationSteps() {
  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">ActivationSteps</Heading>
        <Card className={styles.panel} style={{ marginTop: '1rem' }}>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
            {STEPS.map((step) => (
              <li key={step} style={{ marginBottom: '0.5rem' }}>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </Container>
    </section>
  );
}
