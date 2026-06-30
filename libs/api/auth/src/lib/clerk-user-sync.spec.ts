import { describe, expect, it, vi } from 'vitest';
import {
  applyClerkUserEvent,
  clerkUpsertInputFromWebhook,
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

  it('applyClerkUserEvent upserts on user.created', async () => {
    const prisma = {
      user: {
        upsert: vi.fn().mockResolvedValue({ id: 'db_1' }),
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
    expect(prisma.user.upsert).toHaveBeenCalledOnce();
  });

  it('applyClerkUserEvent deletes on user.deleted', async () => {
    const prisma = {
      user: {
        upsert: vi.fn(),
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
