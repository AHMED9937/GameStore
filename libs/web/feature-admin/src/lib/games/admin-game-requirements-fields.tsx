'use client';

import { Input, Text } from '@gamestore/shared/ui';
import type { GameSystemRequirementsFormValues } from '@gamestore/shared/game-requirements';
import styles from './games.module.css';

const REQUIREMENT_FIELDS: Array<{
  key: keyof Omit<GameSystemRequirementsFormValues, 'requires64Bit'>;
  label: string;
}> = [
  { key: 'os', label: 'OS' },
  { key: 'processor', label: 'Processor' },
  { key: 'memory', label: 'Memory' },
  { key: 'graphics', label: 'Graphics' },
  { key: 'storage', label: 'Storage' },
];

export type AdminGameRequirementsFieldsProps = {
  title: string;
  values: GameSystemRequirementsFormValues;
  disabled?: boolean;
  onChange: (values: GameSystemRequirementsFormValues) => void;
};

export function AdminGameRequirementsFields({
  title,
  values,
  disabled = false,
  onChange,
}: AdminGameRequirementsFieldsProps) {
  const updateField = <K extends keyof GameSystemRequirementsFormValues>(
    field: K,
    nextValue: GameSystemRequirementsFormValues[K],
  ) => {
    onChange({
      ...values,
      [field]: nextValue,
    });
  };

  return (
    <section className={styles.requirementsSection} aria-label={title}>
      <h3 className={styles.requirementsSectionTitle}>{title}</h3>

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={values.requires64Bit}
          disabled={disabled}
          onChange={(event) => updateField('requires64Bit', event.target.checked)}
        />
        <span>Requires a 64-bit processor and operating system</span>
      </label>

      {REQUIREMENT_FIELDS.map((field) => (
        <div key={field.key} className={styles.formField}>
          <Text tone="muted">{field.label}</Text>
          <Input
            name={`${title}-${field.key}`}
            value={values[field.key]}
            disabled={disabled}
            onChange={(event) => updateField(field.key, event.target.value)}
          />
        </div>
      ))}

      <div className={styles.formField}>
        <Text tone="muted">Additional notes</Text>
        <textarea
          className={styles.textarea}
          name={`${title}-additionalNotes`}
          rows={3}
          value={values.additionalNotes}
          disabled={disabled}
          onChange={(event) =>
            updateField('additionalNotes', event.target.value)
          }
        />
      </div>
    </section>
  );
}
