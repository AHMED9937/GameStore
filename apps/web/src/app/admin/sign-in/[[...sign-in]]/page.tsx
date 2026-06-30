import { SignIn } from '@clerk/nextjs';
import { AuthShell } from '../../../../components/auth/auth-shell';

type AdminSignInPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

/** Admin login only — no self-service sign-up. */
export default async function AdminSignInPage({
  searchParams,
}: AdminSignInPageProps) {
  const { redirect_url } = await searchParams;
  const afterSignIn =
    redirect_url && redirect_url.startsWith('/admin')
      ? redirect_url
      : '/admin';

  return (
    <AuthShell
      title="Admin sign in"
      subtitle="Staff access to catalog, licenses, and orders."
      variant="admin"
    >
      <SignIn
        routing="path"
        path="/admin/sign-in"
        signUpUrl="/admin/sign-up"
        fallbackRedirectUrl={afterSignIn}
        forceRedirectUrl={afterSignIn}
      />
    </AuthShell>
  );
}
