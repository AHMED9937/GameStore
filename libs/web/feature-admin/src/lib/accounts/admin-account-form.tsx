'use client';

import { useEffect, useState } from 'react';
import { Input, Text } from '@gamestore/shared/ui';
import { getAdminGames, isSetupResponse } from '@gamestore/web/data-access';
import type { AdminAccountFormValues } from './admin-accounts.types';
import styles from './accounts.module.css';

export type AdminAccountFormProps = {
  mode: 'create' | 'edit';
  values: AdminAccountFormValues;
  disabled?: boolean;
  onValuesChange?: (values: AdminAccountFormValues) => void;
};

export function AdminAccountForm({
  mode,
  values,
  disabled = false,
  onValuesChange,
}: AdminAccountFormProps) {
  const [games, setGames] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (disabled || mode !== 'create') {
      return;
    }
    void getAdminGames().then((result) => {
      if (isSetupResponse(result) || !Array.isArray(result)) {
        return;
      }
      setGames(
        result
          .filter((game) => game.platform === 'steam')
          .map((game) => ({ id: game.id, title: game.title })),
      );
    });
  }, [disabled, mode]);

  const updateField = <K extends keyof AdminAccountFormValues>(
    field: K,
    nextValue: AdminAccountFormValues[K],
  ) => {
    onValuesChange?.({
      ...values,
      [field]: nextValue,
    });
  };

  return (
    <div className={styles.form} aria-label={mode === 'create' ? 'Add pool account' : 'Edit pool account'}>
      {mode === 'create' ? (
        <div className={styles.formField}>
          <Text tone="muted">Game</Text>
          <select
            className={styles.filterSelect}
            name="gameId"
            aria-label="Steam game"
            value={values.gameId}
            disabled={disabled}
            onChange={(event) => updateField('gameId', event.target.value)}
          >
            <option value="">Select Steam game…</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className={styles.formField}>
          <Text tone="muted">Game</Text>
          <Input name="gameTitle" value={values.gameTitle} disabled readOnly />
        </div>
      )}
      <div className={styles.formField}>
        <Text tone="muted">Username</Text>
        <Input
          name="username"
          autoComplete="off"
          value={values.username}
          disabled={disabled}
          onChange={(event) => updateField('username', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Platform</Text>
        <Input name="platform" value={values.platform} disabled readOnly />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Region</Text>
        <Input
          name="region"
          value={values.region}
          disabled={disabled}
          onChange={(event) => updateField('region', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Max active users</Text>
        <Input
          name="maxActiveUsers"
          type="number"
          min={1}
          value={values.maxActiveUsers}
          disabled={disabled}
          onChange={(event) => updateField('maxActiveUsers', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">
          Password{mode === 'edit' ? ' (leave blank to keep current)' : ''}
        </Text>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          disabled={disabled}
          onChange={(event) => updateField('password', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">
          Shared secret{mode === 'edit' ? ' (leave blank to keep current)' : ''}
        </Text>
        <Input
          name="sharedSecret"
          type="password"
          autoComplete="off"
          value={values.sharedSecret}
          disabled={disabled}
          onChange={(event) => updateField('sharedSecret', event.target.value)}
        />
      </div>
    </div>
  );
}
