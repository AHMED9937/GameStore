import Link from 'next/link';
import { Button, Card, Container, Heading, Text } from '@gamestore/shared/ui';
import { getSubscriptionPlans } from '@gamestore/web/data-access';
import { formatPlanInterval } from '@gamestore/web/feature-subscriptions';
import styles from './section.module.css';

export async function HomePromoBanner() {
  let plans: Awaited<ReturnType<typeof getSubscriptionPlans>> = [];

  try {
    plans = await getSubscriptionPlans();
  } catch {
    plans = [];
  }

  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h2" style={{ marginBottom: '1.5rem' }}>
          Join The Pass
        </Heading>
        {plans.length === 0 ? (
          <Card className={styles.panel}>
            <Text tone="muted">
              Subscription plans are coming soon. Browse the shop for individual
              game purchases in the meantime.
            </Text>
          </Card>
        ) : (
          <div className={styles.twoCol}>
            {plans.map((plan) => (
              <Card key={plan.id} className={styles.panel}>
                <Heading level="h3">{plan.name}</Heading>
                <Text tone="muted" style={{ marginTop: '0.5rem' }}>
                  {formatPlanInterval(plan.interval, plan.intervalCount)} access
                  to {plan.games.length} game
                  {plan.games.length === 1 ? '' : 's'}.
                </Text>
                <Link
                  href={`/subscriptions?plan=${encodeURIComponent(plan.slug)}`}
                  className={styles.heroCta}
                  style={{ display: 'inline-flex' }}
                >
                  View plan
                </Link>
              </Card>
            ))}
          </div>
        )}
        {plans.length > 0 ? (
          <Link href="/subscriptions" style={{ marginTop: '1.25rem', display: 'inline-block' }}>
            <Button variant="secondary">Compare all plans</Button>
          </Link>
        ) : null}
      </Container>
    </section>
  );
}
