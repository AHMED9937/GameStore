import { clerkClient } from '@clerk/nextjs/server';
import {
  getRoleFromSessionClaims,
  isAdminPublicMetadata,
  type AppUserRole,
} from './auth-role';

/** JWT claims first; fall back to Clerk publicMetadata when session token is not customized. */
export async function resolveUserRole(
  userId: string | null | undefined,
  sessionClaims: Record<string, unknown> | null | undefined,
): Promise<AppUserRole> {
  if (getRoleFromSessionClaims(sessionClaims) === 'admin') {
    return 'admin';
  }

  if (!userId) {
    return 'user';
  }

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    if (isAdminPublicMetadata(clerkUser.publicMetadata)) {
      return 'admin';
    }
  } catch {
    // Clerk unavailable — rely on JWT claims only.
  }

  return getRoleFromSessionClaims(sessionClaims);
}
