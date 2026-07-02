'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminSubscriptionPlans } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { AdminSubscriptionPlansHeader } from './admin-subscription-plans-header';
import { AdminSubscriptionPlansTable } from './admin-subscription-plans-table';
import type { AdminSubscriptionPlanListItem } from './admin-subscription-plans.types';

export type AdminSubscriptionPlansPageProps = {
  listState?: AdminAsyncState<AdminSubscriptionPlanListItem[]>;
};

function parsePlansList(data: unknown): AdminSubscriptionPlanListItem[] {
  return Array.isArray(data) ? (data as AdminSubscriptionPlanListItem[]) : [];
}

export function AdminSubscriptionPlansPage({
  listState,
}: AdminSubscriptionPlansPageProps) {
  const fetchedState = useAdminListState(
    () => getAdminSubscriptionPlans(),
    parsePlansList,
  );
  const state = listState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminSubscriptionPlansHeader />
        <AdminAsyncView state={state} emptyMessage="No subscription plans yet.">
          {(plans) => <AdminSubscriptionPlansTable plans={plans} />}
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
