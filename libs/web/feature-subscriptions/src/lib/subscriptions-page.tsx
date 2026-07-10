import { Container, Heading, Text } from '@gamestore/shared/ui';
import type { PublicSubscriptionPlan } from '@gamestore/web/data-access';
import { SubscriptionPlanCard } from './components/subscription-plan-card';
import styles from './components/section.module.css';

export type SubscriptionsPageProps = {
  plans: PublicSubscriptionPlan[];
  selectedPlanSlug?: string | null;
  cancelled?: boolean;
};

export function SubscriptionsPage({
  plans,
  selectedPlanSlug = null,
  cancelled = false,
}: SubscriptionsPageProps) {
  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Join The Pass</Heading>
        <Text tone="muted" style={{ marginTop: '0.75rem', maxWidth: '42rem' }}>
          Subscribe for recurring access to every game included in your plan.
          After checkout, your licenses appear in My Games with expiry dates
          tied to your billing period.
        </Text>

        {plans.length === 0 ? (
          <div className={`${styles.banner} ${styles.bannerMuted}`}>
            <Text tone="muted">
              Subscription plans are not available yet. Check back soon.
            </Text>
          </div>
        ) : (
          <div className={styles.grid}>
            {plans.map((plan) => (
              <SubscriptionPlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlanSlug === plan.slug}
                cancelled={cancelled && selectedPlanSlug === plan.slug}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
