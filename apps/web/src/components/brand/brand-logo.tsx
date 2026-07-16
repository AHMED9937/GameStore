import Link from 'next/link';
import { OfflinePrismMark } from './offline-prism-mark';
import styles from './brand-logo.module.css';

export type BrandLogoVariant = 'nav' | 'footer' | 'auth' | 'icon';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  href?: string | null;
  className?: string;
  ariaLabel?: string;
};

function Wordmark({ variant }: { variant: BrandLogoVariant }) {
  if (variant === 'auth' || variant === 'icon') {
    return null;
  }

  if (variant === 'footer') {
    return (
      <span className={styles.wordmark}>
        <span className={styles.offline}>Offline</span>
        <span className={styles.game}>Game</span>
        <span className={styles.nia}>NIA</span>
      </span>
    );
  }

  return (
    <span className={styles.wordmark}>
      <span className={styles.game}>Game</span>
      <span className={styles.nia}>NIA</span>
    </span>
  );
}

export function BrandLogo({
  variant = 'nav',
  href = '/',
  className,
  ariaLabel = 'OfflineGameNIA home',
}: BrandLogoProps) {
  const isIconOnly = variant === 'auth' || variant === 'icon';
  const classes = [
    styles.root,
    styles[variant],
    isIconOnly ? styles.iconOnly : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className={styles.markFrame}>
        <OfflinePrismMark className={styles.mark} />
      </span>
      <Wordmark variant={variant} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <span className={classes} aria-label={ariaLabel} role="img">
      {content}
    </span>
  );
}
