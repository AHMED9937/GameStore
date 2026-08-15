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

describe.skipIf(!hasDatabase)('Admin games API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdGameId = '';
  let createdSlug = '';
  let revokeLicenseId = '';

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    await seedE2eUsers(app);
  });

  afterAll(async () => {
    if (createdGameId) {
      await request(app.getHttpServer())
        .delete(`/api/admin/games/${createdGameId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('GET /api/admin/games returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/games')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/games includes draft games for an admin user', async () => {
    createdSlug = `e2e-admin-game-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'E2E Admin Draft Game',
        slug: createdSlug,
        platform: 'steam',
        priceBase: 12.99,
        genres: ['Adventure'],
        description: LONG_DESCRIPTION,
        coverImage: '/og/default.png',
      })
      .expect(201);

    createdGameId = createResponse.body.id;
    expect(createResponse.body).toMatchObject({
      title: 'E2E Admin Draft Game',
      slug: createdSlug,
      published: false,
      publishedAt: null,
      genres: ['Adventure'],
      requirementsMin: null,
      requirementsRecommended: null,
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdGameId,
          slug: createdSlug,
          published: false,
          publishedAt: null,
        }),
      ]),
    );

    const publicResponse = await request(app.getHttpServer())
      .get('/api/games')
      .expect(200);

    expect(publicResponse.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: createdSlug })]),
    );
  });

  it('PUT /api/admin/games/:id round-trips genres and requirements', async () => {
    expect(createdGameId).toBeTruthy();

    const requirementsMin = {
      requires64Bit: true,
      os: 'Windows 10',
      processor: 'Quad core',
      memory: '8 GB RAM',
      graphics: 'GTX 1060',
      storage: '20 GB',
      additionalNotes: null,
    };
    const requirementsRecommended = {
      requires64Bit: true,
      os: 'Windows 11',
      processor: '8 cores',
      memory: '16 GB RAM',
      graphics: 'RTX 3060',
      storage: '20 GB',
      additionalNotes: null,
    };

    const updateResponse = await request(app.getHttpServer())
      .put(`/api/admin/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({
        genres: ['RPG', 'Sci-Fi'],
        requirementsMin,
        requirementsRecommended,
        releaseDate: '2024-06-01',
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      genres: ['RPG', 'Sci-Fi'],
      requirementsMin,
      requirementsRecommended,
      releaseDate: '2024-06-01',
    });

    const getResponse = await request(app.getHttpServer())
      .get(`/api/admin/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(getResponse.body).toMatchObject({
      genres: ['RPG', 'Sci-Fi'],
      requirementsMin,
      requirementsRecommended,
      releaseDate: '2024-06-01',
    });
  });

  it('POST /api/admin/games/:id/media appears on public game detail', async () => {
    expect(createdGameId).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/api/admin/games/${createdGameId}/media`)
      .set(authAs(E2E_TOKENS.admin))
      .send({
        type: 'video',
        url: 'https://www.youtube.com/embed/e2e-trailer',
        title: 'E2E Trailer',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/admin/games/${createdGameId}/media`)
      .set(authAs(E2E_TOKENS.admin))
      .send({
        type: 'activation',
        url: 'https://www.youtube.com/embed/e2e-activation',
        title: 'Activation guide',
      })
      .expect(201);

    const publicDetail = await request(app.getHttpServer())
      .get(`/api/games/${createdSlug}`)
      .expect(404);

    expect(publicDetail.status).toBe(404);

    const adminMedia = await request(app.getHttpServer())
      .get(`/api/admin/games/${createdGameId}/media`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(adminMedia.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'video', url: expect.stringContaining('e2e-trailer') }),
        expect.objectContaining({ type: 'activation' }),
      ]),
    );
  });

  it('GET /api/admin/games/:id/readiness blocks publish until pool account exists', async () => {
    expect(createdGameId).toBeTruthy();

    const readinessBefore = await request(app.getHttpServer())
      .get(`/api/admin/games/${createdGameId}/readiness`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(readinessBefore.body.canPublish).toBe(false);
    expect(readinessBefore.body.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'pool', passed: false, required: true }),
      ]),
    );

    await request(app.getHttpServer())
      .put(`/api/admin/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: true })
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toMatch(/not ready/i);
      });
  });

  it('publish → public catalog → unpublish lifecycle', async () => {
    expect(createdGameId).toBeTruthy();

    const accountResponse = await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        username: `pool-${createdSlug}`,
        password: 'e2e-test-password',
        sharedSecret: 'e2e-shared-secret-value',
        region: 'global',
      })
      .expect(201);

    const inventoryAccountId = accountResponse.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/admin/accounts/${inventoryAccountId}/assign`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameId: createdGameId })
      .expect(200)
      .expect((response) => {
        expect(response.body.gameId).toBe(createdGameId);
      });

    await request(app.getHttpServer())
      .put(`/api/admin/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: true })
      .expect(200)
      .expect((response) => {
        expect(response.body.published).toBe(true);
        expect(response.body.publishedAt).toEqual(expect.any(String));
      });

    const publicAfterPublish = await request(app.getHttpServer())
      .get('/api/games')
      .expect(200);

    expect(publicAfterPublish.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: createdSlug })]),
    );

    const publicDetail = await request(app.getHttpServer())
      .get(`/api/games/${createdSlug}`)
      .expect(200);

    expect(publicDetail.body.media).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'video' }),
        expect.objectContaining({ type: 'activation' }),
      ]),
    );

    await request(app.getHttpServer())
      .put('/api/admin/games/featured')
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameIds: [createdGameId] })
      .expect(200)
      .expect((response) => {
        expect(response.body.featured).toEqual([
          expect.objectContaining({ id: createdGameId, slug: createdSlug }),
        ]);
      });

    const featuredPublic = await request(app.getHttpServer())
      .get('/api/games/featured')
      .expect(200);

    expect(featuredPublic.body[0]).toMatchObject({ slug: createdSlug });

    const licenseResponse = await request(app.getHttpServer())
      .post('/api/admin/licenses/generate-key')
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameId: createdGameId })
      .expect(201);

    revokeLicenseId = licenseResponse.body.id;

    await request(app.getHttpServer())
      .put(`/api/admin/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: false })
      .expect(200)
      .expect((response) => {
        expect(response.body.published).toBe(false);
        expect(response.body.publishedAt).toBeNull();
        expect(response.body.featuredOrder).toBeNull();
      });

    const licenseAfterUnpublish = await request(app.getHttpServer())
      .get(`/api/admin/licenses/${revokeLicenseId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(licenseAfterUnpublish.body.status).toBe('revoked');

    const publicAfterUnpublish = await request(app.getHttpServer())
      .get('/api/games')
      .expect(200);

    expect(publicAfterUnpublish.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: createdSlug })]),
    );
  });

  it('sold out manual toggle blocks checkout while staying in public catalog', async () => {
    const ts = Date.now();
    const slug = `e2e-sold-out-${ts}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'E2E Sold Out Game',
        slug,
        platform: 'steam',
        priceBase: 11.99,
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
        username: `pool-sold-out-${ts}`,
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

    const publicBeforeSoldOut = await request(app.getHttpServer())
      .get(`/api/games/${slug}`)
      .expect(200);

    expect(publicBeforeSoldOut.body).toMatchObject({
      slug,
      soldOut: false,
    });

    await request(app.getHttpServer())
      .put(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ soldOut: true })
      .expect(200)
      .expect((response) => {
        expect(response.body.soldOutManual).toBe(true);
        expect(response.body.soldOut).toBe(true);
      });

    const publicAfterSoldOut = await request(app.getHttpServer())
      .get(`/api/games/${slug}`)
      .expect(200);

    expect(publicAfterSoldOut.body.soldOut).toBe(true);

    await request(app.getHttpServer())
      .post('/api/payments/checkout')
      .set(authAs(E2E_TOKENS.userA))
      .send({ slug })
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toMatch(/sold out/i);
      });

    await request(app.getHttpServer())
      .put(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ soldOut: false })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);
  });

  it('auto sold out when pool account is deactivated', async () => {
    const ts = Date.now();
    const slug = `e2e-auto-sold-out-${ts}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'E2E Auto Sold Out Game',
        slug,
        platform: 'steam',
        priceBase: 8.99,
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
        username: `pool-auto-sold-out-${ts}`,
        password: 'e2e-test-password',
        sharedSecret: 'e2e-shared-secret-value',
        region: 'global',
      })
      .expect(201);

    const accountId = accountResponse.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/admin/accounts/${accountId}/assign`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameId })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: true })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/admin/accounts/${accountId}/deactivate`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    const publicDetail = await request(app.getHttpServer())
      .get(`/api/games/${slug}`)
      .expect(200);

    expect(publicDetail.body.soldOut).toBe(true);

    await request(app.getHttpServer())
      .put(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ soldOut: false })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);
  });

  it('POST /api/admin/games/bulk-unpublish and bulk-delete remove draft games', async () => {
    const ts = Date.now();
    const slugA = `e2e-bulk-game-a-${ts}`;
    const slugB = `e2e-bulk-game-b-${ts}`;

    const createDraft = async (slug: string, title: string) => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/games')
        .set(authAs(E2E_TOKENS.admin))
        .send({
          title,
          slug,
          platform: 'steam',
          priceBase: 5.99,
          genres: ['Adventure'],
          description: LONG_DESCRIPTION,
          coverImage: '/og/default.png',
        })
        .expect(201);
      return response.body.id as string;
    };

    const bulkIdA = await createDraft(slugA, 'E2E Bulk Game A');
    const bulkIdB = await createDraft(slugB, 'E2E Bulk Game B');

    const unpublishResponse = await request(app.getHttpServer())
      .post('/api/admin/games/bulk-unpublish')
      .set(authAs(E2E_TOKENS.admin))
      .send({ ids: [bulkIdA, bulkIdB] })
      .expect(200);

    expect(unpublishResponse.body).toEqual({
      succeeded: [bulkIdA, bulkIdB],
      failed: [],
    });

    const deleteResponse = await request(app.getHttpServer())
      .post('/api/admin/games/bulk-delete')
      .set(authAs(E2E_TOKENS.admin))
      .send({ ids: [bulkIdA, bulkIdB] })
      .expect(200);

    expect(deleteResponse.body).toEqual({
      succeeded: [bulkIdA, bulkIdB],
      failed: [],
    });

    await request(app.getHttpServer())
      .get(`/api/admin/games/${bulkIdA}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);
  });

  it('DELETE game with completed order keeps order snapshot in admin list', async () => {
    const ts = Date.now();
    const slug = `e2e-order-snap-${ts}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'E2E Order Snapshot Game',
        slug,
        platform: 'steam',
        priceBase: 8.99,
        genres: ['Adventure'],
        description: LONG_DESCRIPTION,
        coverImage: '/og/default.png',
      })
      .expect(201);

    const gameId = createResponse.body.id as string;

    const completedOrder = await prisma.order.create({
      data: {
        gameId,
        gameTitleSnapshot: 'E2E Order Snapshot Game',
        gameSlugSnapshot: slug,
        providerCheckoutId: `txn_test_snap_${ts}`,
        amount: 8.99,
        currency: 'USD',
        status: 'completed',
        buyerEmail: 'snap@example.com',
      },
    });

    await request(app.getHttpServer())
      .delete(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200)
      .expect({ id: gameId, deleted: true });

    const listResponse = await request(app.getHttpServer())
      .get('/api/admin/orders')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    const row = listResponse.body.find(
      (order: { id: string }) => order.id === completedOrder.id,
    );

    expect(row).toMatchObject({
      gameTitle: 'E2E Order Snapshot Game',
      gameSlug: slug,
    });

    await prisma.order.delete({ where: { id: completedOrder.id } });
  });

  it('DELETE /api/admin/games/:id removes the game', async () => {
    expect(createdGameId).toBeTruthy();
    const deletedId = createdGameId;
    createdGameId = '';

    await request(app.getHttpServer())
      .delete(`/api/admin/games/${deletedId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200)
      .expect({ id: deletedId, deleted: true });

    await request(app.getHttpServer())
      .get(`/api/admin/games/${deletedId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Admin games API e2e tests: DATABASE_URL is not set');
}
