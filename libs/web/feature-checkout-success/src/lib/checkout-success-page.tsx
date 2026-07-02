import { Container, Heading } from '@gamestore/shared/ui';
import {
  CheckoutLicenseDisplay,
  CheckoutSuccessError,
  CheckoutSuccessMessage,
} from './components/checkout-success-sections';
import styles from './components/section.module.css';

export type CheckoutSuccessPageProps = {
  sessionId?: string | null;
};

function demoLicenseKey(sessionId: string): string {
  const suffix = sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
  return `GS-DEMO-${suffix || 'PAID'}`;
}

export function CheckoutSuccessPage({ sessionId = null }: CheckoutSuccessPageProps) {
  const id = sessionId?.trim();

  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Order Complete</Heading>
        <div className={styles.content}>
          {!id ? (
            <CheckoutSuccessError message="Invalid checkout session." />
          ) : (
            <>
              <CheckoutSuccessMessage gameTitle="your game" />
              <CheckoutLicenseDisplay
                license={{
                  licenseKey: demoLicenseKey(id),
                  status: 'active',
                  game: {
                    id: 'demo',
                    title: 'Your purchase',
                    slug: 'your-game',
                  },
                }}
              />
              <p className={styles.demoNote} data-testid="checkout-success-demo-note">
                Payment received. Your full license will be wired in a later phase.
              </p>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
