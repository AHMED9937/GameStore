import styles from './ui.module.css';

export type EmptyStateProps = {
  message: string;
  title?: string;
};

export function EmptyState({ message, title }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {title ? <h3 className={styles.h3}>{title}</h3> : null}
      <p className={styles.textMuted}>{message}</p>
    </div>
  );
}
