import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  authAs,
  closeE2eApp,
  createE2eApp,
  seedE2eUsers,
} from './support/e2e-app';
import { E2E_TOKENS } from './support/e2e-auth.tokens';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Games API', () => {
  let app: INestApplication;
  let createdGameId: string;
  let createdSlug: string;

  beforeAll(async () => {
    app = await createE2eApp();
    await seedE2eUsers(app);
  });

  afterAll(async () => {
    if (createdGameId) {
      await request(app.getHttpServer())
        .delete(`/api/games/${createdGameId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('GET /api/games returns published games from the database', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/games')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      slug: expect.any(String),
      title: expect.any(String),
      platform: expect.any(String),
      priceBase: expect.any(String),
    });
    expect(response.headers['cache-control']).toContain('max-age=60');
  });

  it('GET /api/games/demo-game-1 returns a seeded game when present', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/games/demo-game-1',
    );

    if (response.status === 404) {
      return;
    }

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      slug: 'demo-game-1',
      title: 'Stellar Odyssey',
      platform: 'steam',
      metaTitle: expect.anything(),
      metaDescription: expect.anything(),
      ogImage: expect.anything(),
    });
  });

  it('GET /api/games/nonexistent-slug returns 404', async () => {
    await request(app.getHttpServer())
      .get('/api/games/nonexistent-slug-e2e')
      .expect(404);
  });

  it('POST create → GET by slug → DELETE removes the game', async () => {
    createdSlug = `e2e-game-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'E2E Test Game',
        slug: createdSlug,
        platform: 'steam',
        priceBase: 4.99,
        publishedAt: '2026-01-01T00:00:00.000Z',
      })
      .expect(201);

    createdGameId = createResponse.body.id;
    expect(createResponse.body).toMatchObject({
      title: 'E2E Test Game',
      slug: createdSlug,
      priceBase: '4.99',
    });

    const getResponse = await request(app.getHttpServer())
      .get(`/api/games/${createdSlug}`)
      .expect(200);

    expect(getResponse.body.title).toBe('E2E Test Game');

    await request(app.getHttpServer())
      .delete(`/api/games/${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    createdGameId = '';

    await request(app.getHttpServer())
      .get(`/api/games/${createdSlug}`)
      .expect(404);
  });

  it('POST duplicate slug returns 409', async () => {
    const slug = `e2e-dup-${Date.now()}`;
    const payload = {
      title: 'Dup Test',
      slug,
      platform: 'steam',
      priceBase: 1,
      publishedAt: '2026-01-01T00:00:00.000Z',
    };

    const first = await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send(payload)
      .expect(409);

    await request(app.getHttpServer())
      .delete(`/api/games/${first.body.id}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Games API e2e tests: DATABASE_URL is not set');
}
