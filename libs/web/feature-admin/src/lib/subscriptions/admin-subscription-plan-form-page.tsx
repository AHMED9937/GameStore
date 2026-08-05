'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  createAdminSubscriptionPlan,
} from '@gamestore/web/data-access';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import { AdminSubscriptionPlanForm } from './admin-subscription-plan-form';
import {
  EMPTY_ADMIN_SUBSCRIPTION_PLAN_FORM_VALUES,
  type AdminSubscriptionPlanFormValues,
} from './admin-subscription-plans.types';
import styles from './subscriptions.module.css';

export function AdminSubscriptionPlanFormPage() {
  const router = useRouter();
  const [values, setValues] = useState<AdminSubscriptionPlanFormValues>(
    EMPTY_ADMIN_SUBSCRIPTION_PLAN_FORM_VALUES,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!values.name.trim() || !values.providerPriceId.trim()) {
        setError('Plan name and Paddle price ID are required.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const intervalCount = Number.parseInt(values.intervalCount, 10);
        const plan = await createAdminSubscriptionPlan({
          name: values.name.trim(),
          slug: values.slug.trim() || undefined,
          providerPriceId: values.providerPriceId.trim(),
          interval: values.interval,
          intervalCount:
            Number.isInteger(intervalCount) && intervalCount > 0
              ? intervalCount
              : undefined,
          isActive: values.isActive,
          gameIds: values.gameIds,
        });

        router.push(`/admin/subscriptions/${plan.id}`);
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [router, values],
  );

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Add subscription plan"
          description="Create a Paddle price-backed plan and choose which published games it includes."
        />
        <form onSubmit={(event) => void handleSubmit(event)}>
          <AdminSubscriptionPlanForm
            values={values}
            disabled={saving}
            onValuesChange={setValues}
          />
          {error ? (
            <div className={styles.formMessage} role="alert">
              <Text tone="muted">{error}</Text>
            </div>
          ) : null}
          <div className={styles.formActions}>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create plan'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => router.push('/admin/subscriptions')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </AdminPageShell>
    </Container>
  );
}
