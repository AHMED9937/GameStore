import { describe, expect, it, vi } from 'vitest';
import { applyClerkSessionEvent } from './clerk-session-sync';

describe('clerk-session-sync', () => {
  it('writes audit log on session.revoked', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'neon-user-1' }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    const action = await applyClerkSessionEvent(prisma, 'session.revoked', {
      id: 'sess_abc',
      user_id: 'user_clerk_1',
    });

    expect(action).toBe('audited');
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'neon-user-1',
        action: 'auth.session.revoked',
        resource: 'session',
        resourceId: 'sess_abc',
        ip: null,
        userAgent: null,
        metadata: {
          eventType: 'session.revoked',
          clerkUserId: 'user_clerk_1',
        },
      },
    });
  });

  it('ignores unrelated webhook types', async () => {
    const prisma = {
      user: { findUnique: vi.fn() },
      auditLog: { create: vi.fn() },
    };

    await expect(
      applyClerkSessionEvent(prisma, 'session.created', {
        id: 'sess_abc',
        user_id: 'user_clerk_1',
      }),
    ).resolves.toBe('ignored');
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
