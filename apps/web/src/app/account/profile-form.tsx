'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { updateProfileAction } from './actions';
import styles from './account.module.css';

function initialsFromProfile(
  firstName: string,
  lastName: string,
  email: string,
): string {
  const first = firstName.trim()[0] ?? '';
  const last = lastName.trim()[0] ?? '';
  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }
  return email[0]?.toUpperCase() ?? '?';
}

export function ProfileForm() {
  const { isLoaded, user } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    '';

  useEffect(() => {
    if (!user) {
      return;
    }
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
  }, [user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updateProfileAction({ firstName, lastName });
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }

    try {
      await user.reload();
    } catch {
      // Neon + Clerk updated; client cache refresh is best-effort.
    }

    setSuccess('Profile saved.');
    setSaving(false);
  }

  if (!isLoaded) {
    return <p className={styles.muted}>Loading profile…</p>;
  }

  if (!user) {
    return <p className={styles.muted}>Sign in to edit your profile.</p>;
  }

  const avatarUrl = user.imageUrl;
  const initials = initialsFromProfile(firstName, lastName, email);

  return (
    <form className={styles.profileForm} onSubmit={(event) => void handleSubmit(event)}>
      <div className={styles.profileHeader}>
        <div className={styles.avatar} aria-hidden>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className={styles.avatarImage} />
          ) : (
            <span className={styles.avatarInitials}>{initials}</span>
          )}
        </div>
        <div>
          <p className={styles.profileName}>
            {[firstName, lastName].filter(Boolean).join(' ') || email}
          </p>
          <p className={styles.profileEmail}>{email}</p>
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.label}>First name</span>
          <input
            className={styles.input}
            type="text"
            name="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            maxLength={100}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Last name</span>
          <input
            className={styles.input}
            type="text"
            name="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            maxLength={100}
            required
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={`${styles.input} ${styles.inputReadonly}`}
          type="email"
          value={email}
          readOnly
          aria-describedby="email-hint"
        />
        <span id="email-hint" className={styles.fieldHint}>
          Email is managed by your sign-in provider. Contact support to change it.
        </span>
      </label>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <button type="submit" className={styles.saveBtn} disabled={saving}>
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
