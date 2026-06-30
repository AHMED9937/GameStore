import { Suspense } from 'react';
import { AuthRedirectHandler } from './auth-redirect-handler';

export default function AuthRedirectPage() {
  return (
    <Suspense fallback={null}>
      <AuthRedirectHandler />
    </Suspense>
  );
}
