'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Container, SkeletonPanel, SkeletonText } from '@gamestore/shared/ui';
import { deleteAccountAction } from './actions';
import { ProfileForm } from './profile-form';
import styles from './account.module.css';

export default function AccountPage() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (!user || deleting) {
      return;
    }

    const confirmed = window.confirm(
      'Permanently delete your account? Your licenses and purchase history in GameStore will be removed. This cannot be undone.',
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    const result = await deleteAccountAction();
    if (!result.ok) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    try {
      await signOut();
    } catch {
      // Clerk user already deleted server-side.
    }

    router.replace('/');
  }

  if (!isLoaded) {
    return (
      <Container className={styles.page}>
        <SkeletonText width="28%" />
        <SkeletonPanel height={240} style={{ marginTop: '1rem' }} />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className={styles.page}>
        <p className={styles.muted}>Sign in to manage your account.</p>
      </Container>
    );
  }

  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account</h1>
        <p className={styles.subtitle}>Manage your GameStore profile</p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Profile</h2>
        <ProfileForm />
      </section>

      <section className={`${styles.card} ${styles.danger}`}>
        <h2 className={styles.cardTitle}>Delete account</h2>
        <p className={styles.dangerText}>
          Removes your GameStore profile from Neon, then deletes your Clerk sign-in.
          You will lose access to purchased games tied to this account.
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => void handleDeleteAccount()}
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete my account'}
        </button>
      </section>
    </Container>
  );
}
