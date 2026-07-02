'use client';

import { useEffect, useState } from 'react';
import { Input, Text } from '@gamestore/shared/ui';
import { getAdminGames, isSetupResponse } from '@gamestore/web/data-access';
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
  const [publishedGames, setPublishedGames] = useState<
    { id: string; title: string; slug: string }[]
  >([]);

  useEffect(() => {
    if (disabled) {
      return;
    }
    void getAdminGames().then((result) => {
      if (isSetupResponse(result) || !Array.isArray(result)) {
        return;
      }
      setPublishedGames(
        result
          .filter((game) => game.published)
          .map((game) => ({ id: game.id, title: game.title, slug: game.slug })),
      );
    });
  }, [disabled]);

  const updateField = <K extends keyof AdminSubscriptionPlanFormValues>(
    field: K,
    nextValue: AdminSubscriptionPlanFormValues[K],
  ) => {
    onValuesChange?.({
      ...values,
      [field]: nextValue,
    });
  };

  const toggleGame = (gameId: string) => {
    const nextIds = values.gameIds.includes(gameId)
      ? values.gameIds.filter((id) => id !== gameId)
      : [...values.gameIds, gameId];
    updateField('gameIds', nextIds);
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
        <div className={styles.gamePicker} data-testid="admin-subscription-plan-games">
          {publishedGames.length === 0 ? (
            <Text tone="dim">No published games available.</Text>
          ) : (
            publishedGames.map((game) => (
              <label key={game.id} className={styles.gameOption}>
                <input
                  type="checkbox"
                  checked={values.gameIds.includes(game.id)}
                  disabled={disabled}
                  onChange={() => toggleGame(game.id)}
                />
                <span>
                  {game.title} <Text tone="dim">({game.slug})</Text>
                </span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
