import type { PrismaClient, User } from '@prisma/client';
import {
  normalizeOptionalName,
  parseUserRole,
  primaryEmailFromClerkUser,
} from './auth.types';
import type { UserRole } from './auth.types';
import { applyClerkSessionEvent } from './clerk-session-sync';

export type ClerkWebhookUser = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: Array<{ id: string; email_address: string }>;
  primary_email_address_id?: string | null;
  public_metadata?: Record<string, unknown> | null;
};

export type ClerkApiUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
  publicMetadata: Record<string, unknown>;
};

export type ClerkUserMirrorInput = {
  clerkId: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
};

type PrismaUserDelegate = Pick<PrismaClient, 'user'>;

export function clerkApiUserFromSdk(user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
  publicMetadata: Record<string, unknown>;
}): ClerkApiUser {
  return {
    id: user.id,
    firstName: normalizeOptionalName(user.firstName),
    lastName: normalizeOptionalName(user.lastName),
    primaryEmailAddressId: user.primaryEmailAddressId,
    emailAddresses: user.emailAddresses.map((entry) => ({
      id: entry.id,
      emailAddress: entry.emailAddress,
    })),
    publicMetadata: user.publicMetadata,
  };
}

export function clerkUpsertInputFromWebhook(data: ClerkWebhookUser): ClerkUserMirrorInput {
  const email = primaryEmailFromClerkUser(data);
  if (!email) {
    throw new Error(`Clerk user ${data.id} has no email address`);
  }

  return {
    clerkId: data.id,
    email,
    role: parseUserRole(data.public_metadata) satisfies UserRole,
    firstName: normalizeOptionalName(data.first_name),
    lastName: normalizeOptionalName(data.last_name),
  };
}

export function clerkUpsertInputFromApiUser(user: ClerkApiUser): ClerkUserMirrorInput {
  const email =
    user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`Clerk user ${user.id} has no email address`);
  }

  return {
    clerkId: user.id,
    email,
    role: parseUserRole(user.publicMetadata) satisfies UserRole,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export async function upsertClerkUser(
  prisma: PrismaUserDelegate,
  input: ClerkUserMirrorInput,
): Promise<User> {
  const byClerkId = await prisma.user.findUnique({
    where: { clerkId: input.clerkId },
  });

  if (byClerkId) {
    return prisma.user.update({
      where: { id: byClerkId.id },
      data: {
        email: input.email,
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });
  }

  const byEmail = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (byEmail) {
    // Same email, new Clerk user id (dev→live, recreated account): relink row.
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        clerkId: input.clerkId,
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });
  }

  return prisma.user.create({
    data: {
      clerkId: input.clerkId,
      email: input.email,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });
}

export async function deleteMirroredUser(
  prisma: PrismaUserDelegate,
  clerkId: string,
  options?: { email?: string | null },
): Promise<{ deleted: number }> {
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    return { deleted: 1 };
  }

  const email = options?.email?.trim();
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      await prisma.user.delete({ where: { id: byEmail.id } });
      return { deleted: 1 };
    }
  }

  return { deleted: 0 };
}

export async function deleteClerkUserByClerkId(
  prisma: PrismaUserDelegate,
  clerkId: string,
) {
  const result = await deleteMirroredUser(prisma, clerkId);
  return { count: result.deleted };
}

/** Clerk `user.deleted` payloads use `DeletedObjectJSON` (`id` may be optional in types). */
export function clerkIdFromDeletedEvent(data: unknown): string {
  if (!data || typeof data !== 'object') {
    throw new Error('user.deleted payload is not an object');
  }

  const record = data as Record<string, unknown>;
  const id = record['id'];
  if (typeof id === 'string' && id.length > 0) {
    return id;
  }

  throw new Error('user.deleted payload missing id');
}

export type ClerkSyncAction = 'upserted' | 'deleted' | 'audited' | 'ignored';

export async function applyClerkUserEvent(
  prisma: PrismaUserDelegate,
  eventType: string,
  data: unknown,
): Promise<ClerkSyncAction> {
  switch (eventType) {
    case 'user.created':
    case 'user.updated':
      await upsertClerkUser(
        prisma,
        clerkUpsertInputFromWebhook(data as ClerkWebhookUser),
      );
      return 'upserted';
    case 'user.deleted': {
      const clerkId = clerkIdFromDeletedEvent(data);
      const result = await deleteClerkUserByClerkId(prisma, clerkId);
      if (result.count === 0) {
        console.warn(`user.deleted: no Neon row for clerkId=${clerkId}`);
      }
      return 'deleted';
    }
    default:
      return 'ignored';
  }
}

export async function syncClerkApiUser(
  prisma: PrismaUserDelegate,
  user: ClerkApiUser,
): Promise<User> {
  return upsertClerkUser(prisma, clerkUpsertInputFromApiUser(user));
}

export async function applyClerkWebhookEvent(
  prisma: PrismaUserDelegate & Parameters<typeof applyClerkSessionEvent>[0],
  eventType: string,
  data: unknown,
): Promise<ClerkSyncAction> {
  const userAction = await applyClerkUserEvent(prisma, eventType, data);
  if (userAction !== 'ignored') {
    return userAction;
  }

  return applyClerkSessionEvent(prisma, eventType, data);
}
