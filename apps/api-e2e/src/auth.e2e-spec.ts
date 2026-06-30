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

describe.skipIf(!hasDatabase)('Security auth API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
    await seedE2eUsers(app);
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('GET /api/licenses/mine returns 401 without a bearer token', async () => {
    await request(app.getHttpServer()).get('/api/licenses/mine').expect(401);
  });

  it('POST /api/games returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.userA))
      .send({
        title: 'Forbidden Game',
        slug: `e2e-forbidden-${Date.now()}`,
        platform: 'steam',
        priceBase: 1,
        publishedAt: '2026-01-01T00:00:00.000Z',
      })
      .expect(403);
  });

  it('POST /api/games returns 201 for an admin user', async () => {
    const slug = `e2e-admin-game-${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'Admin E2E Game',
        slug,
        platform: 'steam',
        priceBase: 2.99,
        publishedAt: '2026-01-01T00:00:00.000Z',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      slug,
      title: 'Admin E2E Game',
    });

    await request(app.getHttpServer())
      .delete(`/api/games/${response.body.id}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Security auth API e2e tests: DATABASE_URL is not set');
}
