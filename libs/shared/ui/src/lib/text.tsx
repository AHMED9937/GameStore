import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';

export type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  tone?: 'default' | 'muted' | 'dim' | 'accent';
};

const toneClass: Record<NonNullable<TextProps['tone']>, string> = {
  default: styles.text,
  muted: styles.textMuted,
  dim: styles.textDim,
  accent: styles.textAccent,
};

export function Text({
  tone = 'default',
  className,
  children,
  ...props
}: TextProps) {
  return (
    <p className={[toneClass[tone], className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  );
}
