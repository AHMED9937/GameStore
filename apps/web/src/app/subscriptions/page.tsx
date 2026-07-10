import { ApiError, getSubscriptionPlans } from '@gamestore/web/data-access';
import { buildPageMetadata } from '@gamestore/shared/seo';
import {
  SubscriptionsPage,
  type SubscriptionsPageProps,
} from '@gamestore/web/feature-subscriptions';

export const metadata = buildPageMetadata('subscriptions');

type SubscriptionsRouteProps = {
  searchParams: Promise<{ plan?: string; cancelled?: string }>;
};

export default async function Page({ searchParams }: SubscriptionsRouteProps) {
  const params = await searchParams;
  let plans: SubscriptionsPageProps['plans'] = [];

  try {
    plans = await getSubscriptionPlans();
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
  }

  return (
    <SubscriptionsPage
      plans={plans}
      selectedPlanSlug={params.plan ?? null}
      cancelled={params.cancelled === '1'}
    />
  );
}
