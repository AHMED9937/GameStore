import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandLogo } from '../brand/brand-logo';
import styles from './auth.module.css';

type AuthShellProps = {
  title: string;
  subtitle: string;
  variant?: 'user' | 'admin';
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  variant = 'user',
  footer,
  children,
}: AuthShellProps) {
  return (
    <section className={styles.authPage}>
      <div className={styles.authGlowPrimary} aria-hidden />
      <div className={styles.authGlowSecondary} aria-hidden />

      <div className={styles.authInner}>
        <div className={styles.authBrand}>
          <BrandLogo variant="auth" href={null} ariaLabel="OfflineGameNIA" />
          <h1 className={styles.authTitle}>{title}</h1>
          <p className={styles.authSubtitle}>{subtitle}</p>
          {variant === 'admin' ? (
            <span className={styles.authAdminBadge}>Admin access</span>
          ) : null}
        </div>

        <div className={styles.authPanel}>{children}</div>

        {footer ?? (
          <p className={styles.authFooterNote}>
            {variant === 'admin' ? (
              <>
                Not an admin?{' '}
                <Link href="/">Return to store</Link>
              </>
            ) : (
              <>
                Need to activate a key?{' '}
                <Link href="/my-games">Go to My Games</Link>
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
