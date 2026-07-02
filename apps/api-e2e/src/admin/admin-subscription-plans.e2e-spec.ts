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

describe.skipIf(!hasDatabase)('Admin subscription plans API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let planId = '';
  let gameId = '';

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
    if (planId) {
      await prisma.subscriptionPlanGame
        .deleteMany({ where: { planId } })
        .catch(() => undefined);
      await prisma.subscriptionPlan
        .delete({ where: { id: planId } })
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('GET /api/admin/subscription-plans returns plan list for admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/subscription-plans')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/admin/subscription-plans creates a plan with linked games', async () => {
    if (!gameId) {
      return;
    }

    const slug = `e2e-plan-${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/api/admin/subscription-plans')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        name: 'E2E All Access',
        slug,
        stripePriceId: `price_${slug}`,
        interval: 'month',
        gameIds: [gameId],
      })
      .expect(201);

    planId = response.body.id;

    expect(response.body).toMatchObject({
      name: 'E2E All Access',
      slug,
      interval: 'month',
      isActive: true,
      games: [
        expect.objectContaining({
          id: gameId,
          slug: 'demo-game-1',
        }),
      ],
    });
  });

  it('PUT /api/admin/subscription-plans/:id updates plan metadata', async () => {
    if (!planId) {
      return;
    }

    const response = await request(app.getHttpServer())
      .put(`/api/admin/subscription-plans/${planId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({
        name: 'E2E All Access Updated',
        isActive: false,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: planId,
      name: 'E2E All Access Updated',
      isActive: false,
    });
  });

  it('DELETE /api/admin/subscription-plans/:id removes the plan', async () => {
    if (!planId) {
      return;
    }

    await request(app.getHttpServer())
      .delete(`/api/admin/subscription-plans/${planId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/admin/subscription-plans/${planId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);

    planId = '';
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Admin subscription plans e2e tests: DATABASE_URL is not set');
}
