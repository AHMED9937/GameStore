import { describe, expect, it, vi } from 'vitest';
import {
  applyClerkUserEvent,
  clerkUpsertInputFromWebhook,
  upsertClerkUser,
} from './clerk-user-sync';

describe('clerk-user-sync', () => {
  it('maps webhook user payload to upsert input', () => {
    const input = clerkUpsertInputFromWebhook({
      id: 'user_abc',
      primary_email_address_id: 'eml_1',
      email_addresses: [{ id: 'eml_1', email_address: 'player@example.com' }],
      public_metadata: { role: 'admin' },
    });

    expect(input).toEqual({
      clerkId: 'user_abc',
      email: 'player@example.com',
      role: 'admin',
      firstName: null,
      lastName: null,
    });
  });

  it('maps webhook names to upsert input', () => {
    const input = clerkUpsertInputFromWebhook({
      id: 'user_abc',
      first_name: 'Ada',
      last_name: 'Lovelace',
      primary_email_address_id: 'eml_1',
      email_addresses: [{ id: 'eml_1', email_address: 'ada@example.com' }],
      public_metadata: { role: 'user' },
    });

    expect(input.firstName).toBe('Ada');
    expect(input.lastName).toBe('Lovelace');
  });

  it('upsertClerkUser updates when clerkId already exists', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'db_1',
          clerkId: 'user_abc',
          email: 'old@example.com',
        }),
        update: vi.fn().mockResolvedValue({ id: 'db_1', role: 'admin' }),
        create: vi.fn(),
      },
    };

    await upsertClerkUser(prisma, {
      clerkId: 'user_abc',
      email: 'player@example.com',
      role: 'admin',
      firstName: null,
      lastName: null,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'db_1' },
      data: {
        email: 'player@example.com',
        role: 'admin',
        firstName: null,
        lastName: null,
      },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('upsertClerkUser relinks clerkId when email already exists', async () => {
    const prisma = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'db_legacy',
            clerkId: 'user_old_dev',
            email: 'player@example.com',
            role: 'user',
          }),
        update: vi.fn().mockResolvedValue({
          id: 'db_legacy',
          clerkId: 'user_live',
          role: 'admin',
        }),
        create: vi.fn(),
      },
    };

    const result = await upsertClerkUser(prisma, {
      clerkId: 'user_live',
      email: 'player@example.com',
      role: 'admin',
      firstName: 'Ada',
      lastName: null,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'db_legacy' },
      data: {
        clerkId: 'user_live',
        role: 'admin',
        firstName: 'Ada',
        lastName: null,
      },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(result.clerkId).toBe('user_live');
  });

  it('upsertClerkUser creates when clerkId and email are new', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 'db_new', clerkId: 'user_new' }),
      },
    };

    await upsertClerkUser(prisma, {
      clerkId: 'user_new',
      email: 'new@example.com',
      role: 'user',
      firstName: null,
      lastName: null,
    });

    expect(prisma.user.create).toHaveBeenCalledOnce();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('applyClerkUserEvent upserts on user.created', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'db_1' }),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    const action = await applyClerkUserEvent(prisma, 'user.created', {
      id: 'user_abc',
      email_addresses: [{ id: 'eml_1', email_address: 'player@example.com' }],
      primary_email_address_id: 'eml_1',
      public_metadata: { role: 'user' },
    });

    expect(action).toBe('upserted');
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });

  it('applyClerkUserEvent deletes on user.deleted', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'db_1', clerkId: 'user_abc' }),
        delete: vi.fn().mockResolvedValue({ id: 'db_1' }),
      },
    };

    const action = await applyClerkUserEvent(prisma, 'user.deleted', {
      id: 'user_abc',
      deleted: true,
    });

    expect(action).toBe('deleted');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { clerkId: 'user_abc' },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'db_1' } });
  });

  it('deleteMirroredUser falls back to email', async () => {
    const { deleteMirroredUser } = await import('./clerk-user-sync');
    const prisma = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'db_2', email: 'player@example.com' }),
        delete: vi.fn().mockResolvedValue({ id: 'db_2' }),
      },
    };

    const result = await deleteMirroredUser(prisma, 'user_wrong', {
      email: 'player@example.com',
    });

    expect(result.deleted).toBe(1);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'db_2' } });
  });

  it('clerkIdFromDeletedEvent rejects missing id', async () => {
    const { clerkIdFromDeletedEvent } = await import('./clerk-user-sync');
    expect(() => clerkIdFromDeletedEvent({ deleted: true })).toThrow(/missing id/);
  });
});
