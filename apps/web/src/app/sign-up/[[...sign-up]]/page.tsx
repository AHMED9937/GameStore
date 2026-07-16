import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { AuthShell } from '../../../components/auth/auth-shell';
import styles from '../../../components/auth/auth.module.css';

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join OfflineGameNIA to track purchases and activate your games."
      variant="user"
      footer={
        <p className={styles.authFooterNote}>
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      }
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/auth/redirect"
        forceRedirectUrl="/auth/redirect"
      />
    </AuthShell>
  );
}
