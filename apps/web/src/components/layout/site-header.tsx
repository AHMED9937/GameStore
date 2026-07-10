'use client';

import Link from 'next/link';
import { Show, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { Container } from '@gamestore/shared/ui';
import { isAdminPublicMetadata } from '../../lib/auth-role';
import styles from './layout.module.css';

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/my-games', label: 'My Games' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;

export function SiteHeader() {
  const { user } = useUser();
  const isAdmin = isAdminPublicMetadata(user?.publicMetadata);

  return (
    <header className={styles.header}>
      <Container className={styles.headerInner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon} aria-hidden>
            ◆
          </span>
          <span className={styles.logoText}>GameStore</span>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.navLink}>
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <Link href="/my-games" className={styles.activateLink}>
            <span aria-hidden>🔑</span>
            Activate Key
          </Link>

          <Show when="signed-out">
            <SignInButton mode="redirect" forceRedirectUrl="/auth/redirect">
              <button type="button" className={styles.signInBtn}>
                Sign in
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            {isAdmin ? (
              <Link href="/admin" className={styles.adminLink}>
                Admin
              </Link>
            ) : null}
            <UserButton
              userProfileUrl="/account"
              appearance={{
                elements: {
                  avatarBox: styles.userAvatar,
                },
              }}
            />
          </Show>

          <button type="button" className={styles.menuBtn} aria-label="Menu">
            <span aria-hidden>☰</span>
          </button>
        </div>
      </Container>
    </header>
  );
}
