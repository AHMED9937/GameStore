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

export function SkeletonText({
  className,
  ...props
}: Omit<SkeletonProps, 'height' | 'rounded'>) {
  return (
    <Skeleton
      height={14}
      rounded="sm"
      className={[styles.skeletonText, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export function SkeletonButton({
  height = 42,
  className,
  ...props
}: SkeletonProps) {
  return (
    <Skeleton
      height={height}
      rounded="md"
      className={[styles.skeletonButton, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export function SkeletonBanner({
  className,
  ...props
}: Omit<SkeletonProps, 'height'>) {
  return (
    <Skeleton
      height={56}
      rounded="md"
      className={[styles.skeletonBanner, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export function SkeletonPanel({
  className,
  ...props
}: Omit<SkeletonProps, 'rounded'>) {
  return (
    <Skeleton
      rounded="lg"
      className={[styles.skeletonPanel, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
