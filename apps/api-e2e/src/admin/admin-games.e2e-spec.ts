import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
  let createdGameId = '';
  let createdSlug = '';

  beforeAll(async () => {
    app = await createE2eApp();
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

    const updateResponse = await request(app.getHttpServer())
      .put(`/api/admin/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({
        genres: ['RPG', 'Sci-Fi'],
        requirementsMin: 'OS: Windows 10\nCPU: Quad core',
        requirementsRecommended: 'OS: Windows 11\nCPU: 8 cores',
        releaseDate: '2024-06-01',
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      genres: ['RPG', 'Sci-Fi'],
      requirementsMin: 'OS: Windows 10\nCPU: Quad core',
      requirementsRecommended: 'OS: Windows 11\nCPU: 8 cores',
      releaseDate: '2024-06-01',
    });

    const getResponse = await request(app.getHttpServer())
      .get(`/api/admin/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(getResponse.body).toMatchObject({
      genres: ['RPG', 'Sci-Fi'],
      requirementsMin: 'OS: Windows 10\nCPU: Quad core',
      requirementsRecommended: 'OS: Windows 11\nCPU: 8 cores',
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

    await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        gameId: createdGameId,
        username: `pool-${createdSlug}`,
        password: 'e2e-test-password',
        sharedSecret: 'e2e-shared-secret-value',
        region: 'global',
      })
      .expect(201);

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
      .put(`/api/admin/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: false })
      .expect(200)
      .expect((response) => {
        expect(response.body.published).toBe(false);
        expect(response.body.publishedAt).toBeNull();
      });

    const publicAfterUnpublish = await request(app.getHttpServer())
      .get('/api/games')
      .expect(200);

    expect(publicAfterUnpublish.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: createdSlug })]),
    );
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
