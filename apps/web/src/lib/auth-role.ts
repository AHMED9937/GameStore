export type AppUserRole = 'admin' | 'user';

export function isAdminPublicMetadata(publicMetadata: unknown): boolean {
  return (
    !!publicMetadata &&
    typeof publicMetadata === 'object' &&
    'role' in publicMetadata &&
    (publicMetadata as { role?: string }).role === 'admin'
  );
}

export function safeAuthRedirectPath(
  path: string | null | undefined,
  allowAdmin: boolean,
): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }
  if (!allowAdmin && path.startsWith('/admin')) {
    return null;
  }
  return path;
}

export function safeAdminRedirectPath(
  path: string | null | undefined,
): string | null {
  if (!path || !path.startsWith('/admin') || path.startsWith('//')) {
    return null;
  }
  return path;
}

export function buildAuthRedirectTarget(redirectUrl?: string | null): string {
  if (!redirectUrl) {
    return '/auth/redirect';
  }
  return `/auth/redirect?redirect_url=${encodeURIComponent(redirectUrl)}`;
}

export function buildAdminPostSignInTarget(redirectUrl?: string | null): string {
  const target = safeAdminRedirectPath(redirectUrl) ?? '/admin';
  return buildAuthRedirectTarget(target);
}

export function resolveSignInPath(redirectUrl?: string | null): string {
  const adminTarget = safeAdminRedirectPath(redirectUrl);
  if (adminTarget?.startsWith('/admin')) {
    return `/admin/sign-in?redirect_url=${encodeURIComponent(adminTarget)}`;
  }

  const userTarget = safeAuthRedirectPath(redirectUrl, false);
  if (userTarget) {
    return `/sign-in?redirect_url=${encodeURIComponent(userTarget)}`;
  }

  return '/sign-in';
}

export function resolvePostAuthPath(
  publicMetadata: unknown,
  redirectUrl?: string | null,
): string {
  return resolvePostAuthPathForRole(
    isAdminPublicMetadata(publicMetadata) ? 'admin' : 'user',
    redirectUrl,
  );
}

export function resolvePostAuthPathForRole(
  role: AppUserRole,
  redirectUrl?: string | null,
): string {
  if (role === 'admin') {
    return safeAdminRedirectPath(redirectUrl) ?? '/admin';
  }
  return safeAuthRedirectPath(redirectUrl, false) ?? '/my-games';
}

export function getRoleFromSessionClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): AppUserRole {
  const claims = sessionClaims as
    | {
        metadata?: { role?: string };
        public_metadata?: { role?: string };
      }
    | undefined;

  const role = claims?.metadata?.role ?? claims?.public_metadata?.role;
  return role === 'admin' ? 'admin' : 'user';
}
