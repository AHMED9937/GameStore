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

describe.skipIf(!hasDatabase)('Admin orders bulk API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let gameId = '';
  let pendingOrderId = '';
  let failedOrderId = '';

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    await seedE2eUsers(app);

    const game = await prisma.game.findFirst({
      where: { slug: 'demo-game-1', publishedAt: { not: null } },
    });
    gameId = game?.id ?? '';
  });

  afterAll(async () => {
    if (pendingOrderId) {
      await prisma.order.delete({ where: { id: pendingOrderId } }).catch(() => undefined);
    }
    if (failedOrderId) {
      await prisma.order.delete({ where: { id: failedOrderId } }).catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('POST /api/admin/orders/bulk-delete removes pending and failed orders', async () => {
    if (!gameId) {
      return;
    }

    const ts = Date.now();
    const pending = await prisma.order.create({
      data: {
        gameId,
        providerCheckoutId: `txn_test_bulk_pending_${ts}`,
        amount: 19.99,
        currency: 'USD',
        status: 'pending',
      },
    });
    const failed = await prisma.order.create({
      data: {
        gameId,
        providerCheckoutId: `txn_test_bulk_failed_${ts}`,
        amount: 9.99,
        currency: 'USD',
        status: 'failed',
      },
    });

    pendingOrderId = pending.id;
    failedOrderId = failed.id;

    const response = await request(app.getHttpServer())
      .post('/api/admin/orders/bulk-delete')
      .set(authAs(E2E_TOKENS.admin))
      .send({ ids: [pendingOrderId, failedOrderId] })
      .expect(200);

    expect(response.body).toEqual({
      succeeded: [pendingOrderId, failedOrderId],
      failed: [],
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/admin/orders')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    const ids = listResponse.body.map((order: { id: string }) => order.id);
    expect(ids).not.toContain(pendingOrderId);
    expect(ids).not.toContain(failedOrderId);

    pendingOrderId = '';
    failedOrderId = '';
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Admin orders bulk API e2e tests: DATABASE_URL is not set');
}
