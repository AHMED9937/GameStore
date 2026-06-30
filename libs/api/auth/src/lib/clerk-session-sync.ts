import type { PrismaClient } from '@prisma/client';
import { writeAuditLog } from './audit-log';

export type ClerkSessionWebhook = {
  id?: string;
  user_id?: string;
};

type SessionPrisma = Pick<PrismaClient, 'auditLog' | 'user'>;

export function clerkUserIdFromSessionEvent(data: unknown): string {
  if (!data || typeof data !== 'object') {
    throw new Error('session webhook payload is not an object');
  }

  const record = data as ClerkSessionWebhook;
  if (typeof record.user_id === 'string' && record.user_id.length > 0) {
    return record.user_id;
  }

  throw new Error('session webhook payload missing user_id');
}

export function sessionIdFromEvent(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const id = (data as ClerkSessionWebhook).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export async function applyClerkSessionEvent(
  prisma: SessionPrisma,
  eventType: string,
  data: unknown,
): Promise<'audited' | 'ignored'> {
  if (eventType !== 'session.revoked' && eventType !== 'session.ended') {
    return 'ignored';
  }

  const clerkUserId = clerkUserIdFromSessionEvent(data);
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });

  await writeAuditLog(prisma, {
    userId: user?.id ?? null,
    action: 'auth.session.revoked',
    resource: 'session',
    resourceId: sessionIdFromEvent(data),
    metadata: { eventType, clerkUserId },
  });

  return 'audited';
}
