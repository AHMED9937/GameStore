import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';

type Level = 'h1' | 'h2' | 'h3';

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: Level;
  gradient?: boolean;
};

const levelClass: Record<Level, string> = {
  h1: styles.h1,
  h2: styles.h2,
  h3: styles.h3,
};

export function Heading({
  level = 'h2',
  gradient = false,
  className,
  children,
  ...props
}: HeadingProps) {
  const Tag = level;
  return (
    <Tag
      className={[
        levelClass[level],
        gradient ? 'hero-gradient-text' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Tag>
  );
}
