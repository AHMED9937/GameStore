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

export function resolvePostAuthPath(
  publicMetadata: unknown,
  redirectUrl?: string | null,
): string {
  const admin = isAdminPublicMetadata(publicMetadata);
  if (admin) {
    return safeAuthRedirectPath(redirectUrl, true) ?? '/admin';
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
