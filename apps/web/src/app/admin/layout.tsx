'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import styles from './admin.module.css';

const NAV_ITEMS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/games', label: 'Games' },
  { href: '/admin/licenses', label: 'Licenses' },
  { href: '/admin/accounts', label: 'Accounts' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/admin/video-guides', label: 'Video guides' },
  { href: '/admin/audit', label: 'Audit' },
  { href: '/admin/igdb', label: 'IGDB' },
];

function AdminNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav className={styles.nav} aria-label="Admin">
      {NAV_ITEMS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? styles.navLinkActive : styles.navLink}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const isAuthOnlyRoute =
    pathname.startsWith('/admin/sign-in') ||
    pathname.startsWith('/admin/sign-up');

  if (isAuthOnlyRoute) {
    return <>{children}</>;
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} aria-hidden>
            ◆
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>GameStore</span>
            <span className={styles.brandSubtitle}>Admin</span>
          </div>
        </div>

        <AdminNav />

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.storeLink}>
            ← Back to store
          </Link>
          <UserButton
            userProfileUrl="/account"
            afterSignOutUrl="/admin/sign-in"
            appearance={{
              elements: {
                avatarBox: styles.userAvatar,
              },
            }}
          />
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <h1 className={styles.topbarTitle}>Administration</h1>
          <UserButton
            userProfileUrl="/account"
            afterSignOutUrl="/admin/sign-in"
            appearance={{
              elements: {
                avatarBox: styles.userAvatar,
              },
            }}
          />
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
