import type { CSSProperties, HTMLAttributes } from 'react';
import styles from './ui.module.css';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg';
};

export function Skeleton({
  width,
  height,
  rounded = 'md',
  className,
  style,
  ...props
}: SkeletonProps) {
  const inlineStyle: CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      className={[
        styles.skeleton,
        rounded === 'sm' ? styles.skeletonRoundedSm : '',
        rounded === 'lg' ? styles.skeletonRoundedLg : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={inlineStyle}
      aria-hidden="true"
      {...props}
    />
  );
}
