import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import type { User } from '@prisma/client';
import {
  clerkApiUserFromSdk,
  syncClerkApiUser,
  deleteMirroredUser,
  parseProfileUpdateInput,
  type ClerkApiUser,
  type ProfileUpdateInput,
} from '@gamestore/api/auth/sync';
import { db } from '@gamestore/api/prisma/db';

export type ClerkAuthContext = {
  isAuthenticated: boolean;
  userId: string | null;
};

export async function getClerkAuth(): Promise<ClerkAuthContext> {
  const { isAuthenticated, userId } = await auth();
  return { isAuthenticated, userId };
}

/** Clerk Neon pattern: read identity from `auth()`, then use `userId` as `clerkId` in Neon. */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

function mapClerkSdkUser(
  clerkUser: Awaited<
    ReturnType<Awaited<ReturnType<typeof clerkClient>>['users']['getUser']>
  >,
): ClerkApiUser {
  return clerkApiUserFromSdk({
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    primaryEmailAddressId: clerkUser.primaryEmailAddressId,
    emailAddresses: clerkUser.emailAddresses.map((entry) => ({
      id: entry.id,
      emailAddress: entry.emailAddress,
    })),
    publicMetadata: clerkUser.publicMetadata as Record<string, unknown>,
  });
}

async function fetchClerkApiUser(clerkId: string): Promise<ClerkApiUser> {
  const client = await clerkClient();
  return mapClerkSdkUser(await client.users.getUser(clerkId));
}

/** JIT sync: Clerk `userId` → Neon `users.clerkId` (login / server action fallback). */
export async function ensureDbUserForClerkId(clerkId: string): Promise<User> {
  const existing = await db.user.findUnique({ where: { clerkId } });
  if (existing) {
    return existing;
  }

  return syncClerkApiUser(db, await fetchClerkApiUser(clerkId));
}

/** Requires signed-in Clerk session; returns mirrored Neon user row. */
export async function ensureDbUser(): Promise<User> {
  const clerkId = await getClerkUserId();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }
  return ensureDbUserForClerkId(clerkId);
}

export async function getDbUserIfAuthenticated(): Promise<User | null> {
  const clerkId = await getClerkUserId();
  if (!clerkId) {
    return null;
  }

  try {
    return await ensureDbUserForClerkId(clerkId);
  } catch {
    return null;
  }
}

/** Remove mirrored Neon row for the signed-in Clerk user (before Clerk account deletion). */
export async function deleteDbUser(): Promise<{ deleted: number }> {
  const clerkId = await getClerkUserId();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  let email: string | null = null;
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    email =
      clerkUser.emailAddresses.find(
        (entry) => entry.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null;
  } catch {
    // Clerk user may already be removed; clerkId-only delete still attempted.
  }

  return deleteMirroredUser(db, clerkId, { email });
}

/** Update Clerk profile (source of truth) and mirror to Neon. */
export async function updateUserProfile(input: ProfileUpdateInput): Promise<User> {
  const clerkId = await getClerkUserId();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  const profile = parseProfileUpdateInput(input);
  const client = await clerkClient();

  await client.users.updateUser(clerkId, {
    firstName: profile.firstName,
    lastName: profile.lastName,
  });

  return syncClerkApiUser(db, mapClerkSdkUser(await client.users.getUser(clerkId)));
}
