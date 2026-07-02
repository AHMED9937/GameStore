'use client';

import { useEffect, useState } from 'react';
import { Input, Text } from '@gamestore/shared/ui';
import { getAdminGames, isSetupResponse } from '@gamestore/web/data-access';
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
  const [games, setGames] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (disabled) {
      return;
    }
    void getAdminGames().then((result) => {
      if (isSetupResponse(result) || !Array.isArray(result)) {
        return;
      }
      setGames(result.map((game) => ({ id: game.id, title: game.title })));
    });
  }, [disabled]);

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
        <select
          className={styles.select}
          name="gameId"
          value={values.gameId}
          disabled={disabled}
          onChange={(event) => updateField('gameId', event.target.value)}
        >
          <option value="">Select game…</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.title}
            </option>
          ))}
        </select>
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
