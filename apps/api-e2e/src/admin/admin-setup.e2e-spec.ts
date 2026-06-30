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

describe.skipIf(!hasDatabase)('Admin setup API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
    await seedE2eUsers(app);
  });

  afterAll(async () => {
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

  it('GET /api/admin/stats returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual({
      status: 'setup',
      integration: 'admin-dashboard',
      message: 'Admin dashboard — not implemented yet',
    });
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Admin setup API e2e tests: DATABASE_URL is not set');
}
