import { Input, Text } from '@gamestore/shared/ui';
import type { AdminLicenseFormValues } from './admin-licenses.types';
import styles from './licenses.module.css';

export type AdminLicenseFormProps = {
  values?: AdminLicenseFormValues;
  disabled?: boolean;
};

const EMPTY_VALUES: AdminLicenseFormValues = {
  gameId: '',
  quantity: '1',
  buyerEmail: '',
};

export function AdminLicenseForm({
  values = EMPTY_VALUES,
  disabled = true,
}: AdminLicenseFormProps) {
  return (
    <form
      className={styles.form}
      aria-label="Issue license"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className={styles.formField}>
        <Text tone="muted">Game</Text>
        <Input name="gameId" placeholder="Select game" defaultValue={values.gameId} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Quantity</Text>
        <Input
          name="quantity"
          type="number"
          min="1"
          defaultValue={values.quantity}
          disabled={disabled}
        />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Buyer email (optional)</Text>
        <Input
          name="buyerEmail"
          type="email"
          defaultValue={values.buyerEmail}
          disabled={disabled}
        />
      </div>
    </form>
  );
}
