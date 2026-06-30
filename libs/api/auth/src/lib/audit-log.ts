import type { Prisma } from '@prisma/client';

export type AuditLogInput = {
  userId?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type AuditLogDelegate = {
  auditLog: {
    create: (args: { data: AuditLogInput }) => Promise<unknown>;
  };
};

export async function writeAuditLog(
  prisma: AuditLogDelegate,
  input: AuditLogInput,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      resource: input.resource ?? null,
      resourceId: input.resourceId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}
