import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@gamestore/api/prisma';
import {
  authAs,
  closeE2eApp,
  createE2eApp,
  seedE2eUsers,
} from '../support/e2e-app';
import { E2E_TOKENS } from '../support/e2e-auth.tokens';

const hasDatabase = Boolean(process.env.DATABASE_URL);

const LONG_DESCRIPTION =
  'A richly detailed game description for e2e testing that exceeds fifty characters.';

describe.skipIf(!hasDatabase)('Admin game discount API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let gameId = '';

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    await seedE2eUsers(app);

    const slug = `e2e-discount-${Date.now()}`;
    const created = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'E2E Discount Game',
        slug,
        platform: 'steam',
        priceBase: 19.99,
        description: LONG_DESCRIPTION,
        coverImage: '/og/default.png',
      })
      .expect(201);
    gameId = created.body.id;
  });

  afterAll(async () => {
    if (gameId) {
      await request(app.getHttpServer())
        .delete(`/api/admin/games/${gameId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
      await prisma.gameDiscount.deleteMany({ where: { gameId } }).catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('rejects invalid discount body', async () => {
    await request(app.getHttpServer())
      .put(`/api/admin/games/${gameId}/discount`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ percentOff: 10, durationDays: 0, durationHours: 0 })
      .expect(400);
  });

  it('upserts and ends a discount', async () => {
    const upsert = await request(app.getHttpServer())
      .put(`/api/admin/games/${gameId}/discount`)
      .set(authAs(E2E_TOKENS.admin))
      .send({
        percentOff: 20,
        durationDays: 1,
        durationHours: 0,
        showCountdown: true,
      })
      .expect(200);

    expect(upsert.body).toMatchObject({
      percentOff: 20,
      priceSale: '15.99',
      status: 'active',
      showCountdown: true,
      enabled: true,
    });

    const detail = await request(app.getHttpServer())
      .get(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(detail.body.discount).toMatchObject({
      percentOff: 20,
      status: 'active',
    });

    await request(app.getHttpServer())
      .delete(`/api/admin/games/${gameId}/discount`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    const after = await request(app.getHttpServer())
      .get(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(after.body.discount?.enabled).toBe(false);
    expect(after.body.discount?.status).toBe('disabled');
  });
});
