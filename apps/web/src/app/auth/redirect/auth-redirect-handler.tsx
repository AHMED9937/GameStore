'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { SkeletonButton } from '@gamestore/shared/ui';
import { BrandLogo } from '../../../components/brand/brand-logo';
import { isAdminPublicMetadata, resolvePostAuthPathForRole, resolveSignInPath } from '../../../lib/auth-role';
import styles from '../../../components/auth/auth.module.css';

export function AuthRedirectHandler() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoaded || redirected.current) {
      return;
    }

    if (!isSignedIn) {
      redirected.current = true;
      router.replace(resolveSignInPath(searchParams.get('redirect_url')));
      return;
    }

    if (!user) {
      return;
    }

    redirected.current = true;

    const run = async () => {
      try {
        await fetch('/api/users/sync', { method: 'POST' });
      } catch {
        // Webhook may still sync; do not block login.
      }

      let role: 'admin' | 'user' = 'user';
      try {
        const me = await fetch('/api/users/me');
        if (me.ok) {
          const body = (await me.json()) as { role?: string };
          if (body.role === 'admin') {
            role = 'admin';
          }
        }
      } catch {
        // Fall back to Clerk metadata on the client.
      }

      if (role !== 'admin' && isAdminPublicMetadata(user.publicMetadata)) {
        role = 'admin';
      }

      const target = resolvePostAuthPathForRole(
        role,
        searchParams.get('redirect_url'),
      );
      router.replace(target);
    };

    void run();
  }, [isLoaded, isSignedIn, user, router, searchParams]);

  return (
    <section className={styles.authPage}>
      <div className={styles.authGlowPrimary} aria-hidden />
      <div className={styles.authGlowSecondary} aria-hidden />
      <div className={styles.authInner}>
        <div className={styles.authBrand}>
          <BrandLogo variant="auth" href={null} ariaLabel="OfflineGameNIA" />
          <h1 className={styles.authTitle}>One moment</h1>
          <p className={styles.authSubtitle}>Finishing sign-in…</p>
          <SkeletonButton
            width={48}
            height={48}
            rounded="lg"
            style={{ margin: '1.25rem auto 0' }}
          />
        </div>
      </div>
    </section>
  );
}
