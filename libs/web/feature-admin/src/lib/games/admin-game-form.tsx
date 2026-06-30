import { Input, Text } from '@gamestore/shared/ui';
import type { AdminGameFormValues } from './admin-games.types';
import styles from './games.module.css';

export type AdminGameFormProps = {
  values?: AdminGameFormValues;
  disabled?: boolean;
};

const EMPTY_VALUES: AdminGameFormValues = {
  title: '',
  slug: '',
  platform: 'PC',
  description: '',
  priceBase: '',
};

export function AdminGameForm({
  values = EMPTY_VALUES,
  disabled = true,
}: AdminGameFormProps) {
  return (
    <form className={styles.form} aria-label="Game details" onSubmit={(e) => e.preventDefault()}>
      <div className={styles.formField}>
        <Text tone="muted">Title</Text>
        <Input name="title" defaultValue={values.title} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Slug</Text>
        <Input name="slug" defaultValue={values.slug} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Platform</Text>
        <Input name="platform" defaultValue={values.platform} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Description</Text>
        <Input name="description" defaultValue={values.description} disabled={disabled} />
      </div>
      <div className={styles.formField}>
        <Text tone="muted">Base price</Text>
        <Input
          name="priceBase"
          type="number"
          step="0.01"
          defaultValue={values.priceBase}
          disabled={disabled}
        />
      </div>
    </form>
  );
}
