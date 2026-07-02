'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Container, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  deleteAdminSubscriptionPlan,
  getAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
  type AdminSubscriptionPlanRecord,
} from '@gamestore/web/data-access';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import { AdminSubscriptionPlanForm } from './admin-subscription-plan-form';
import type { AdminSubscriptionPlanFormValues } from './admin-subscription-plans.types';
import styles from './subscriptions.module.css';

export type AdminSubscriptionPlanEditPageProps = {
  planId: string;
};

function toFormValues(plan: AdminSubscriptionPlanRecord): AdminSubscriptionPlanFormValues {
  return {
    name: plan.name,
    slug: plan.slug,
    stripePriceId: plan.stripePriceId,
    interval: plan.interval,
    intervalCount: String(plan.intervalCount),
    isActive: plan.isActive,
    gameIds: plan.games.map((game) => game.id),
  };
}

export function AdminSubscriptionPlanEditPage({
  planId,
}: AdminSubscriptionPlanEditPageProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<AdminSubscriptionPlanRecord | null>(null);
  const [values, setValues] = useState<AdminSubscriptionPlanFormValues | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminSubscriptionPlan(planId);
      setPlan(result);
      setValues(toFormValues(result));
    } catch (loadError: unknown) {
      setError(apiErrorMessage(loadError));
      setPlan(null);
      setValues(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!plan || !values) {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const intervalCount = Number.parseInt(values.intervalCount, 10);
        const result = await updateAdminSubscriptionPlan(plan.id, {
          name: values.name.trim(),
          slug: values.slug.trim(),
          stripePriceId: values.stripePriceId.trim(),
          interval: values.interval,
          intervalCount:
            Number.isInteger(intervalCount) && intervalCount > 0
              ? intervalCount
              : undefined,
          isActive: values.isActive,
          gameIds: values.gameIds,
        });

        setPlan(result);
        setValues(toFormValues(result));
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [plan, values],
  );

  const handleDelete = useCallback(async () => {
    if (!plan || !window.confirm('Delete this subscription plan permanently?')) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteAdminSubscriptionPlan(plan.id);
      router.push('/admin/subscriptions');
    } catch (deleteError: unknown) {
      setError(apiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }, [plan, router]);

  if (loading) {
    return (
      <Container>
        <AdminPageShell>
          <Text tone="dim">Loading plan…</Text>
        </AdminPageShell>
      </Container>
    );
  }

  if (!plan || !values) {
    return (
      <Container>
        <AdminPageShell>
          <AdminPageHeader title="Plan not found" />
          {error ? (
            <Text tone="muted" role="alert">
              {error}
            </Text>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/admin/subscriptions')}
          >
            Back to plans
          </Button>
        </AdminPageShell>
      </Container>
    );
  }

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Edit subscription plan"
          description="Update billing metadata and linked published games."
        />
        <div className={styles.statusRow} data-testid="admin-subscription-plan-status">
          <Badge variant={plan.isActive ? 'success' : 'default'}>
            {plan.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Text tone="muted">{plan.games.length} linked games</Text>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <AdminSubscriptionPlanForm
            values={values}
            disabled={saving || deleting}
            onValuesChange={setValues}
          />
          {error ? (
            <div className={styles.formMessage} role="alert">
              <Text tone="muted">{error}</Text>
            </div>
          ) : null}
          <div className={styles.formActions}>
            <Button type="submit" disabled={saving || deleting}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              onClick={() => router.push('/admin/subscriptions')}
            >
              Back to plans
            </Button>
          </div>
        </form>
        <section className={styles.deleteSection} data-testid="admin-subscription-plan-delete">
          <Text tone="muted">
            Delete only when no buyers are subscribed to this plan.
          </Text>
          <div className={styles.secondaryActions}>
            <Button
              type="button"
              variant="secondary"
              disabled={saving || deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? 'Deleting…' : 'Delete plan'}
            </Button>
          </div>
        </section>
      </AdminPageShell>
    </Container>
  );
}
