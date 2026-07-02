'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Card,
  Container,
  Heading,
  Text,
} from '@gamestore/shared/ui';
import {
  ApiError,
  getMySubscriptions,
  type UserSubscriptionRecord,
} from '@gamestore/web/data-access';
import {
  formatPlanInterval,
} from '@gamestore/web/feature-subscriptions';
import styles from './section.module.css';

export function MySubscriptionsPanel() {
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionRecord[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await getMySubscriptions();
        if (!cancelled) {
          setSubscriptions(rows);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setSubscriptions([]);
          } else {
            setError(
              err instanceof ApiError
                ? err.message
                : 'Could not load your subscriptions',
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || subscriptions.length === 0) {
    return null;
  }

  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">Your pass</Heading>
        {error ? <Text tone="muted">{error}</Text> : null}
        <div className={styles.licenseList}>
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className={styles.panel}>
              <div className={styles.subscriptionHeader}>
                <div>
                  <Text>
                    <strong>{subscription.plan.name}</strong>
                  </Text>
                  <Text tone="muted">
                    {formatPlanInterval(
                      subscription.plan.interval,
                      subscription.plan.intervalCount,
                    )}{' '}
                    — {subscription.status}
                  </Text>
                </div>
                <Badge variant="accent">
                  Renews{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Badge>
              </div>
              <Text tone="muted" style={{ marginTop: '0.75rem' }}>
                {subscription.licenses.length} game
                {subscription.licenses.length === 1 ? '' : 's'} included
                {subscription.cancelAtPeriodEnd
                  ? ' — cancels at period end'
                  : ''}
              </Text>
            </Card>
          ))}
        </div>
        <Link href="/subscriptions" className={styles.shopLink}>
          View all plans
        </Link>
      </Container>
    </section>
  );
}
