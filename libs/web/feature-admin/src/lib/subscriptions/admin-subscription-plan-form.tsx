'use client';

import { Input, Text } from '@gamestore/shared/ui';
import { AdminGameMultiSearchField } from '../components/admin-game-multi-search-field';
import type { AdminSubscriptionPlanFormValues } from './admin-subscription-plans.types';
import { SUBSCRIPTION_INTERVAL_OPTIONS } from './subscriptions.constants';
import styles from './subscriptions.module.css';

export type AdminSubscriptionPlanFormProps = {
  values: AdminSubscriptionPlanFormValues;
  disabled?: boolean;
  onValuesChange?: (values: AdminSubscriptionPlanFormValues) => void;
};

export function AdminSubscriptionPlanForm({
  values,
  disabled = false,
  onValuesChange,
}: AdminSubscriptionPlanFormProps) {
  const updateField = <K extends keyof AdminSubscriptionPlanFormValues>(
    field: K,
    nextValue: AdminSubscriptionPlanFormValues[K],
  ) => {
    onValuesChange?.({
      ...values,
      [field]: nextValue,
    });
  };

  return (
    <div className={styles.form} aria-label="Subscription plan form">
      <div className={styles.formField}>
        <Text tone="muted">Plan name</Text>
        <Input
          name="name"
          value={values.name}
          disabled={disabled}
          onChange={(event) => updateField('name', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Slug</Text>
        <Input
          name="slug"
          value={values.slug}
          disabled={disabled}
          onChange={(event) => updateField('slug', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Stripe price ID</Text>
        <Input
          name="stripePriceId"
          value={values.stripePriceId}
          disabled={disabled}
          onChange={(event) => updateField('stripePriceId', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Billing interval</Text>
        <select
          className={styles.select}
          name="interval"
          value={values.interval}
          disabled={disabled}
          onChange={(event) => updateField('interval', event.target.value)}
        >
          {SUBSCRIPTION_INTERVAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Interval count</Text>
        <Input
          name="intervalCount"
          type="number"
          min={1}
          value={values.intervalCount}
          disabled={disabled}
          onChange={(event) => updateField('intervalCount', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <label className={styles.gameOption}>
          <input
            type="checkbox"
            checked={values.isActive}
            disabled={disabled}
            onChange={(event) => updateField('isActive', event.target.checked)}
          />
          <Text tone="muted">Plan is active</Text>
        </label>
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Published games in plan</Text>
        <AdminGameMultiSearchField
          value={values.gameIds}
          disabled={disabled}
          gameFilter="published"
          onChange={(gameIds) => updateField('gameIds', gameIds)}
        />
      </div>
    </div>
  );
}
