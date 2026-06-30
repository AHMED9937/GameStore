import { Input, Text } from '@gamestore/shared/ui';
import type { AdminAccountFormValues } from './admin-accounts.types';
import styles from './accounts.module.css';

export type AdminAccountFormProps = {
  values?: AdminAccountFormValues;
  disabled?: boolean;
};

const EMPTY_VALUES: AdminAccountFormValues = {
  gameId: '',
  username: '',
  platform: 'Steam',
  region: 'global',
  password: '',
  sharedSecret: '',
};

export function AdminAccountForm({
  values = EMPTY_VALUES,
  disabled = true,
}: AdminAccountFormProps) {
  return (
    <form
      className={styles.form}
      aria-label="Add pool account"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className={styles.formField}>
        <Text tone="muted">Game</Text>
        <Input name="gameId" placeholder="Select game" defaultValue={values.gameId} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Username</Text>
        <Input name="username" autoComplete="off" defaultValue={values.username} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Platform</Text>
        <Input name="platform" defaultValue={values.platform} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Region</Text>
        <Input name="region" defaultValue={values.region} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Password</Text>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          defaultValue={values.password}
          disabled={disabled}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Shared secret</Text>
        <Input
          name="sharedSecret"
          type="password"
          autoComplete="off"
          defaultValue={values.sharedSecret}
          disabled={disabled}
        />
      </div>
    </form>
  );
}
