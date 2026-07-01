import styles from './steam-access.module.css';

export type AdditionalInfoPanelProps = {
  content?: string | null;
};

export function AdditionalInfoPanel({ content }: AdditionalInfoPanelProps) {
  const text = content?.trim();

  return (
    <section className={styles.additionalSection} data-testid="steam-additional-info">
      <h3 className={styles.additionalHeading}>Additional information</h3>
      <p className={styles.additionalBody}>
        {text || 'No additional information available.'}
      </p>
    </section>
  );
}
