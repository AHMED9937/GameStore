import styles from './accounts.module.css';

export type AdminAccountsEmptyProps = {
  message?: string;
};

export function AdminAccountsEmpty({
  message = 'No pool accounts yet.',
}: AdminAccountsEmptyProps = {}) {
  return (
    <div className={styles.tableEmpty} data-testid="admin-accounts-empty">
      <p className={styles.tableEmptyMessage}>{message}</p>
    </div>
  );
}
