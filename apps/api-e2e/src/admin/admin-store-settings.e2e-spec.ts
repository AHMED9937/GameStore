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

const LONG_DESCRIPTION =
  'A richly detailed game description for e2e testing that exceeds fifty characters.';

const DEFAULT_EMBED = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
const CUSTOM_EMBED = 'https://www.youtube.com/embed/custom-activation';

async function createPublishableGame(
  app: INestApplication,
  slug: string,
  title: string,
) {
  const createResponse = await request(app.getHttpServer())
    .post('/api/admin/games')
    .set(authAs(E2E_TOKENS.admin))
    .send({
      title,
      slug,
      platform: 'steam',
      priceBase: 12.99,
      genres: ['Adventure'],
      description: LONG_DESCRIPTION,
      coverImage: '/og/default.png',
    })
    .expect(201);

  const gameId = createResponse.body.id as string;

  const accountResponse = await request(app.getHttpServer())
    .post('/api/admin/accounts')
    .set(authAs(E2E_TOKENS.admin))
    .send({
      username: `pool-${slug}`,
      password: 'e2e-test-password',
      sharedSecret: 'e2e-shared-secret-value',
      region: 'global',
    })
    .expect(201);

  await request(app.getHttpServer())
    .post(`/api/admin/accounts/${accountResponse.body.id}/assign`)
    .set(authAs(E2E_TOKENS.admin))
    .send({ gameId })
    .expect(200);

  await request(app.getHttpServer())
    .put(`/api/admin/games/${gameId}`)
    .set(authAs(E2E_TOKENS.admin))
    .send({ published: true })
    .expect(200);

  return { gameId, slug };
}

describe.skipIf(!hasDatabase)('Admin store settings API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let gameWithoutActivationId = '';
  let gameWithoutActivationSlug = '';
  let gameWithActivationId = '';
  let gameWithActivationSlug = '';

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    await seedE2eUsers(app);

    gameWithoutActivationSlug = `e2e-no-activation-${Date.now()}`;
    const withoutActivation = await createPublishableGame(
      app,
      gameWithoutActivationSlug,
      'E2E No Activation Game',
    );
    gameWithoutActivationId = withoutActivation.gameId;

    gameWithActivationSlug = `e2e-with-activation-${Date.now()}`;
    const withActivation = await createPublishableGame(
      app,
      gameWithActivationSlug,
      'E2E With Activation Game',
    );
    gameWithActivationId = withActivation.gameId;

    await request(app.getHttpServer())
      .post(`/api/admin/games/${gameWithActivationId}/media`)
      .set(authAs(E2E_TOKENS.admin))
      .send({
        type: 'activation',
        url: CUSTOM_EMBED,
        title: 'Custom activation',
      })
      .expect(201);
  });

  afterAll(async () => {
    await prisma.storeSetting.deleteMany({
      where: { key: 'default_activation_video_url' },
    });

    for (const id of [gameWithoutActivationId, gameWithActivationId]) {
      if (id) {
        await request(app.getHttpServer())
          .delete(`/api/admin/games/${id}`)
          .set(authAs(E2E_TOKENS.admin))
          .catch(() => undefined);
      }
    }

    await closeE2eApp(app);
  });

  it('GET /api/admin/settings/activation-video returns 403 for non-admin', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/settings/activation-video')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/settings/activation-video returns null when unset', async () => {
    await prisma.storeSetting.deleteMany({
      where: { key: 'default_activation_video_url' },
    });

    const response = await request(app.getHttpServer())
      .get('/api/admin/settings/activation-video')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual({ url: null });
  });

  it('PUT /api/admin/settings/activation-video saves normalized embed URL', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/admin/settings/activation-video')
      .set(authAs(E2E_TOKENS.admin))
      .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
      .expect(200);

    expect(response.body).toEqual({ url: DEFAULT_EMBED });
  });

  it('GET /api/games/:slug injects store default activation media', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/games/${gameWithoutActivationSlug}`)
      .expect(200);

    expect(response.body.media).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'store-default-activation',
          type: 'activation',
          url: DEFAULT_EMBED,
        }),
      ]),
    );
  });

  it('GET /api/games/:slug keeps per-game activation when present', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/games/${gameWithActivationSlug}`)
      .expect(200);

    const activationItems = response.body.media.filter(
      (item: { type: string }) => item.type === 'activation',
    );

    expect(activationItems).toHaveLength(1);
    expect(activationItems[0]).toEqual(
      expect.objectContaining({
        type: 'activation',
        url: CUSTOM_EMBED,
      }),
    );
    expect(activationItems[0].id).not.toBe('store-default-activation');
  });

  it('PUT /api/admin/settings/activation-video with null clears default', async () => {
    await request(app.getHttpServer())
      .put('/api/admin/settings/activation-video')
      .set(authAs(E2E_TOKENS.admin))
      .send({ url: null })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/api/games/${gameWithoutActivationSlug}`)
      .expect(200);

    expect(
      response.body.media.some((item: { type: string }) => item.type === 'activation'),
    ).toBe(false);
  });
});

if (!hasDatabase) {
  console.warn(
    'Skipping admin store settings API e2e tests: DATABASE_URL is not set',
  );
}
