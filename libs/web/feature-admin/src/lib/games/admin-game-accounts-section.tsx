'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  createAdminAccount,
  deactivateAdminAccount,
  getAdminAccounts,
  isSetupResponse,
  type AdminAccountRecord,
} from '@gamestore/web/data-access';
import styles from './games.module.css';

export type AdminGameAccountsSectionProps = {
  gameId: string;
  disabled?: boolean;
};

export function AdminGameAccountsSection({
  gameId,
  disabled = false,
}: AdminGameAccountsSectionProps) {
  const [accounts, setAccounts] = useState<AdminAccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sharedSecret, setSharedSecret] = useState('');
  const [region, setRegion] = useState('global');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminAccounts(gameId);
      if (isSetupResponse(result)) {
        setError(result.message);
        setAccounts([]);
        return;
      }
      setAccounts(result);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!username.trim() || !password.trim() || !sharedSecret.trim()) {
      setError('Username, password, and shared secret are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createAdminAccount({
        gameId,
        username: username.trim(),
        password: password.trim(),
        sharedSecret: sharedSecret.trim(),
        region: region.trim() || 'global',
      });
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }
      setUsername('');
      setPassword('');
      setSharedSecret('');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(accountId: string) {
    if (!window.confirm('Deactivate this pool account?')) {
      return;
    }
    try {
      await deactivateAdminAccount(accountId);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const activeCount = accounts.filter((account) => account.isActive).length;

  return (
    <div data-testid="admin-game-accounts-section">
      <Text tone="muted">
        Pool accounts: {accounts.length} total · {activeCount} active
      </Text>
      {loading ? <Text tone="dim">Loading accounts…</Text> : null}
      {error ? (
        <Text tone="muted" role="alert">
          {error}
        </Text>
      ) : null}
      <ul className={styles.mediaList}>
        {accounts.map((account) => (
          <li key={account.id} className={styles.mediaRow}>
            <div>
              <strong>{account.username}</strong> — {account.region}
              <div className={styles.mediaUrl}>
                {account.isActive ? 'Active' : 'Inactive'} ·{' '}
                {account.activeUsersCount} active users
              </div>
            </div>
            {account.isActive ? (
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                onClick={() => void handleDeactivate(account.id)}
              >
                Deactivate
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <div className={styles.mediaForm}>
        <div className={styles.formField}>
          <Text tone="muted">Username</Text>
          <Input
            value={username}
            disabled={disabled || saving}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="pool-my-game"
          />
        </div>
        <div className={styles.formField}>
          <Text tone="muted">Password</Text>
          <Input
            type="password"
            value={password}
            disabled={disabled || saving}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className={styles.formField}>
          <Text tone="muted">Shared secret (Steam Guard)</Text>
          <Input
            type="password"
            value={sharedSecret}
            disabled={disabled || saving}
            onChange={(event) => setSharedSecret(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className={styles.formField}>
          <Text tone="muted">Region</Text>
          <Input
            value={region}
            disabled={disabled || saving}
            onChange={(event) => setRegion(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || saving}
          onClick={() => void handleCreate()}
        >
          {saving ? 'Creating…' : 'Add pool account'}
        </Button>
      </div>
    </div>
  );
}
