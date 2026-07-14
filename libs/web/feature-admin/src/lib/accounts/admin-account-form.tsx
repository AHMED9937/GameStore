'use client';

import { Input, Text } from '@gamestore/shared/ui';
import { AdminGameSearchField } from '../components/admin-game-search-field';
import type { AdminAccountFormValues } from './admin-accounts.types';
import styles from './accounts.module.css';

export type AdminAccountFormProps = {
  mode: 'create' | 'edit';
  values: AdminAccountFormValues;
  disabled?: boolean;
  minMaxActiveUsers?: number;
  onValuesChange?: (values: AdminAccountFormValues) => void;
};

export function AdminAccountForm({
  mode,
  values,
  disabled = false,
  minMaxActiveUsers = 1,
  onValuesChange,
}: AdminAccountFormProps) {
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
          <AdminGameSearchField
            name="gameId"
            value={values.gameId}
            disabled={disabled}
            ariaLabel="Steam game"
            gameFilter="steam"
            placeholder="Search Steam games…"
            clearOption={{ label: 'Unassigned (inventory)' }}
            onChange={(gameId) => updateField('gameId', gameId)}
          />
          <Text tone="dim">
            Unassigned accounts appear in the game edit account picker.
          </Text>
        </div>
      ) : (
        <div className={styles.formField}>
          <Text tone="muted">Game</Text>
          <Input
            name="gameTitle"
            value={values.gameTitle || 'Unassigned (inventory)'}
            disabled
            readOnly
          />
        </div>
      )}
      <div className={styles.formField}>
        <Text tone="muted">Username</Text>
        <Input
          name="username"
          autoComplete="off"
          value={values.username}
          disabled={disabled || mode === 'edit'}
          readOnly={mode === 'edit'}
          onChange={(event) => updateField('username', event.target.value)}
        />
        {mode === 'edit' ? (
          <Text tone="dim">Username cannot be changed after create.</Text>
        ) : null}
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
          min={minMaxActiveUsers}
          value={values.maxActiveUsers}
          disabled={disabled}
          onChange={(event) => updateField('maxActiveUsers', event.target.value)}
        />
        {mode === 'edit' ? (
          <Text tone="dim">
            Cannot be set below occupied seats ({minMaxActiveUsers}).
          </Text>
        ) : null}
      </div>
      {mode === 'create' ? (
        <>
          <div className={styles.formField}>
            <Text tone="muted">Password</Text>
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
            <Text tone="muted">Shared secret</Text>
            <Input
              name="sharedSecret"
              type="password"
              autoComplete="off"
              value={values.sharedSecret}
              disabled={disabled}
              onChange={(event) => updateField('sharedSecret', event.target.value)}
            />
          </div>
        </>
      ) : (
        <div className={styles.credentialsSection} data-testid="admin-account-credentials">
          <Text>Credentials</Text>
          <Text tone="dim">
            Leave blank to keep current values. Rotating password or shared secret
            clears any active Steam Guard lock.
          </Text>
          <div className={styles.formField}>
            <Text tone="muted">New password (optional)</Text>
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
            <Text tone="muted">New shared secret (optional)</Text>
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
      )}
    </div>
  );
}
