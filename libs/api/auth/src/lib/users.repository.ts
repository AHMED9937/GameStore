import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { User } from '@prisma/client';
import {
  applyClerkWebhookEvent,
  clerkUpsertInputFromWebhook,
  syncClerkApiUser,
  upsertClerkUser,
  type ClerkApiUser,
  type ClerkUserMirrorInput,
} from './clerk-user-sync';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({ where: { clerkId } });
  }

  upsertFromClerk(input: ClerkUserMirrorInput): Promise<User> {
    return upsertClerkUser(this.prisma, input);
  }

  deleteByClerkId(clerkId: string) {
    return this.prisma.user.deleteMany({ where: { clerkId } });
  }

  upsertFromClerkWebhookUser(data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string | null;
    public_metadata?: Record<string, unknown> | null;
  }) {
    const input = clerkUpsertInputFromWebhook(data);
    return this.upsertFromClerk(input);
  }

  applyClerkEvent(eventType: string, data: unknown) {
    return applyClerkWebhookEvent(this.prisma, eventType, data);
  }

  syncFromClerkApiUser(user: ClerkApiUser) {
    return syncClerkApiUser(this.prisma, user);
  }
}
