import {
  Badge,
  Card,
  Heading,
  Text,
} from '@gamestore/shared/ui';
import type { PublicSubscriptionPlan } from '@gamestore/web/data-access';
import { getGameCardCover } from '@gamestore/web/data-access';
import { formatPlanInterval } from '../subscription.utils';
import { SubscriptionCheckoutButton } from './subscription-checkout-button';
import styles from './section.module.css';

export type SubscriptionPlanCardProps = {
  plan: PublicSubscriptionPlan;
  selected?: boolean;
  cancelled?: boolean;
};

export function SubscriptionPlanCard({
  plan,
  selected = false,
  cancelled = false,
}: SubscriptionPlanCardProps) {
  return (
    <Card
      className={`${styles.panel} ${styles.planCard} ${
        selected ? styles.planCardSelected : ''
      }`}
      data-testid={`subscription-plan-${plan.slug}`}
    >
      <div>
        <Heading level="h3">{plan.name}</Heading>
        <Text tone="muted" style={{ marginTop: '0.5rem' }}>
          {formatPlanInterval(plan.interval, plan.intervalCount)} access to{' '}
          {plan.games.length} game{plan.games.length === 1 ? '' : 's'}
        </Text>
        {cancelled && selected ? (
          <Badge variant="accent" style={{ marginTop: '0.75rem' }}>
            Checkout cancelled you can try again
          </Badge>
        ) : null}
      </div>

      <div className={styles.gameList}>
        {plan.games.map((game) => (
          <div key={game.id} className={styles.gameRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getGameCardCover(game)}
              alt=""
              className={styles.gameCover}
            />
            <Text>{game.title}</Text>
          </div>
        ))}
      </div>

      <SubscriptionCheckoutButton planSlug={plan.slug} />
    </Card>
  );
}
