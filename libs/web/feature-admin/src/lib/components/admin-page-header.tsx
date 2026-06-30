import type { ReactNode } from 'react';
import { Heading, Text } from '@gamestore/shared/ui';
import styles from './admin-components.module.css';

export type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTitles}>
        <Heading level="h2">{title}</Heading>
        {description ? <Text tone="muted">{description}</Text> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  );
}
