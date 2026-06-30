import { SignIn } from '@clerk/nextjs';
import { AuthShell } from '../../../components/auth/auth-shell';
import { buildAuthRedirectTarget } from '../../../lib/auth-role';

type SignInPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect_url } = await searchParams;
  const afterSignIn = buildAuthRedirectTarget(redirect_url);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your library, orders, and activation keys."
      variant="user"
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={afterSignIn}
        forceRedirectUrl={afterSignIn}
      />
    </AuthShell>
  );
}
