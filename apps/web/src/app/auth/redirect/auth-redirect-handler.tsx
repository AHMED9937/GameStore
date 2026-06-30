'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { resolvePostAuthPath, resolveSignInPath } from '../../../lib/auth-role';
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

      const target = resolvePostAuthPath(
        user.publicMetadata,
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
          <div className={styles.authLogo} aria-hidden>
            ◆
          </div>
          <h1 className={styles.authTitle}>One moment</h1>
          <p className={styles.authSubtitle}>Finishing sign-in…</p>
          <div className={styles.authSpinner} aria-hidden />
        </div>
      </div>
    </section>
  );
}
