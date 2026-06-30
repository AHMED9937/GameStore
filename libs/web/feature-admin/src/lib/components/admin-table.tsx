import type { ReactNode } from 'react';
import styles from './admin-components.module.css';

export type AdminTableColumn = {
  key: string;
  header: string;
};

export type AdminTableProps = {
  columns: AdminTableColumn[];
  children: ReactNode;
  caption?: string;
};

export function AdminTable({ columns, children, caption }: AdminTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
