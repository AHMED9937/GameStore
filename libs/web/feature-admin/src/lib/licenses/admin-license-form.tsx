'use client';

import { Input, Text } from '@gamestore/shared/ui';
import { AdminGameSearchField } from '../components/admin-game-search-field';
import type { AdminLicenseFormValues } from './admin-licenses.types';
import styles from './licenses.module.css';

export type AdminLicenseFormProps = {
  values: AdminLicenseFormValues;
  disabled?: boolean;
  onValuesChange?: (values: AdminLicenseFormValues) => void;
};

export function AdminLicenseForm({
  values,
  disabled = false,
  onValuesChange,
}: AdminLicenseFormProps) {
  const updateField = <K extends keyof AdminLicenseFormValues>(
    field: K,
    nextValue: AdminLicenseFormValues[K],
  ) => {
    onValuesChange?.({
      ...values,
      [field]: nextValue,
    });
  };

  return (
    <div className={styles.form} aria-label="Issue license">
      <div className={styles.formField}>
        <Text tone="muted">Game</Text>
        <AdminGameSearchField
          name="gameId"
          value={values.gameId}
          disabled={disabled}
          ariaLabel="Game"
          placeholder="Search games by title or slug…"
          onChange={(gameId) => updateField('gameId', gameId)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Quantity</Text>
        <Input
          name="quantity"
          type="number"
          min="1"
          max="25"
          value={values.quantity}
          disabled={disabled}
          onChange={(event) => updateField('quantity', event.target.value)}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Buyer email (optional)</Text>
        <Input
          name="buyerEmail"
          type="email"
          value={values.buyerEmail}
          disabled={disabled}
          onChange={(event) => updateField('buyerEmail', event.target.value)}
        />
      </div>
    </div>
  );
}
