'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import styles from './layout.module.css';

type SiteShellProps = {
  children: React.ReactNode;
};

function isBareRoute(pathname: string) {
  return (
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/auth/redirect') ||
    pathname.startsWith('/admin')
  );
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname() ?? '';

  if (isBareRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className={styles.siteWrapper}>
      <SiteHeader />
      <main className={styles.siteMain}>{children}</main>
      <SiteFooter />
    </div>
  );
}
