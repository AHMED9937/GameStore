import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ hover = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={[
        styles.card,
        hover ? styles.cardHover : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
