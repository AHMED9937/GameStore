import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClerkAuthGuard } from '@gamestore/api/auth';
import { PrismaService } from '@gamestore/api/prisma';
import { AppModule } from '../../../api/src/app/app.module';
import { E2eClerkAuthGuard } from './e2e-auth.guard';
import {
  bearerToken,
  clearE2eUsers,
  E2E_TOKENS,
  registerE2eUser,
} from './e2e-auth.tokens';

export async function createE2eApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ClerkAuthGuard)
    .useClass(E2eClerkAuthGuard)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

export async function seedE2eUsers(app: INestApplication) {
  const prisma = app.get(PrismaService);

  const admin = await prisma.user.upsert({
    where: { clerkId: 'e2e-clerk-admin' },
    update: { role: 'admin', email: 'e2e-admin@test.local' },
    create: {
      clerkId: 'e2e-clerk-admin',
      email: 'e2e-admin@test.local',
      role: 'admin',
    },
  });

  const userA = await prisma.user.upsert({
    where: { clerkId: 'e2e-clerk-user-a' },
    update: { role: 'user', email: 'e2e-user-a@test.local' },
    create: {
      clerkId: 'e2e-clerk-user-a',
      email: 'e2e-user-a@test.local',
      role: 'user',
    },
  });

  const userB = await prisma.user.upsert({
    where: { clerkId: 'e2e-clerk-user-b' },
    update: { role: 'user', email: 'e2e-user-b@test.local' },
    create: {
      clerkId: 'e2e-clerk-user-b',
      email: 'e2e-user-b@test.local',
      role: 'user',
    },
  });

  clearE2eUsers();

  registerE2eUser(E2E_TOKENS.admin, {
    id: admin.id,
    clerkId: admin.clerkId,
    email: admin.email,
    firstName: null,
    lastName: null,
    role: 'admin',
  });

  registerE2eUser(E2E_TOKENS.userA, {
    id: userA.id,
    clerkId: userA.clerkId,
    email: userA.email,
    firstName: null,
    lastName: null,
    role: 'user',
  });

  registerE2eUser(E2E_TOKENS.userB, {
    id: userB.id,
    clerkId: userB.clerkId,
    email: userB.email,
    firstName: null,
    lastName: null,
    role: 'user',
  });

  return { admin, userA, userB };
}

export function authAs(token: string): { Authorization: string } {
  return { Authorization: bearerToken(token) };
}

export async function closeE2eApp(app: INestApplication | undefined): Promise<void> {
  clearE2eUsers();
  if (app) {
    await app.close();
  }
}
