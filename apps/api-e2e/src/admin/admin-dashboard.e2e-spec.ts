import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '@gamestore/api/prisma';
import {
  authAs,
  closeE2eApp,
  createE2eApp,
  seedE2eUsers,
} from '../support/e2e-app';
import { E2E_TOKENS } from '../support/e2e-auth.tokens';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Admin dashboard API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUserId = '';
  const createdIds: {
    gameId?: string;
    licenseId?: string;
    accountId?: string;
    orderId?: string;
    auditLogId?: string;
  } = {};

  beforeAll(async () => {
    app = await createE2eApp();
    const users = await seedE2eUsers(app);
    prisma = app.get(PrismaService);
    adminUserId = users.admin.id;

    const ts = Date.now();
    const slug = `e2e-dashboard-${ts}`;

    const game = await prisma.game.create({
      data: {
        title: 'Dashboard E2E Game',
        slug,
        platform: 'steam',
        priceBase: 9.99,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    createdIds.gameId = game.id;

    const license = await prisma.license.create({
      data: {
        licenseKey: `E2E-DASH-LIC-${ts}`,
        gameId: game.id,
        status: 'activated',
        activatedAt: new Date(),
      },
    });
    createdIds.licenseId = license.id;

    const account = await prisma.gameAccount.create({
      data: {
        gameId: game.id,
        platform: 'steam',
        username: `e2e-dashboard-acct-${ts}`,
        passwordEncrypted: 'encrypted',
        sharedSecret: 'secret',
        isActive: true,
      },
    });
    createdIds.accountId = account.id;

    const order = await prisma.order.create({
      data: {
        gameId: game.id,
        providerCheckoutId: `txn_test_dashboard_${ts}`,
        amount: 9.99,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date(),
      },
    });
    createdIds.orderId = order.id;

    const auditLog = await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'dashboard.e2e.test',
        resource: 'game',
        resourceId: game.id,
      },
    });
    createdIds.auditLogId = auditLog.id;
  });

  afterAll(async () => {
    if (createdIds.auditLogId) {
      await prisma.auditLog
        .delete({ where: { id: createdIds.auditLogId } })
        .catch(() => undefined);
    }
    if (createdIds.orderId) {
      await prisma.order
        .delete({ where: { id: createdIds.orderId } })
        .catch(() => undefined);
    }
    if (createdIds.licenseId) {
      await prisma.license
        .delete({ where: { id: createdIds.licenseId } })
        .catch(() => undefined);
    }
    if (createdIds.accountId) {
      await prisma.gameAccount
        .delete({ where: { id: createdIds.accountId } })
        .catch(() => undefined);
    }
    if (createdIds.gameId) {
      await prisma.game
        .delete({ where: { id: createdIds.gameId } })
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('GET /api/admin/stats returns 401 without a bearer token', async () => {
    await request(app.getHttpServer()).get('/api/admin/stats').expect(401);
  });

  it('GET /api/admin/stats returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/stats returns live dashboard stats for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toMatchObject({
      publishedGames: expect.any(Number),
      activeLicenses: expect.any(Number),
      poolAccounts: expect.any(Number),
      ordersToday: expect.any(Number),
      recentActivity: expect.any(Array),
    });

    expect(response.body.publishedGames).toBeGreaterThanOrEqual(1);
    expect(response.body.activeLicenses).toBeGreaterThanOrEqual(1);
    expect(response.body.poolAccounts).toBeGreaterThanOrEqual(1);
    expect(response.body.ordersToday).toBeGreaterThanOrEqual(1);

    const persistedAuditLog = await prisma.auditLog.findUnique({
      where: { id: createdIds.auditLogId },
    });
    expect(persistedAuditLog).toMatchObject({
      action: 'dashboard.e2e.test',
      resource: 'game',
      resourceId: createdIds.gameId,
      userId: adminUserId,
    });

    if (response.body.recentActivity.length > 0) {
      expect(response.body.recentActivity[0]).toMatchObject({
        id: expect.any(String),
        action: expect.any(String),
        createdAt: expect.any(String),
      });
    }
  });
});
