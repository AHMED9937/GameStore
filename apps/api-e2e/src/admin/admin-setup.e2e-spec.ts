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

  it('GET /api/admin/games returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/games')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/games remains public and unchanged', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/games')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /api/admin/licenses returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/licenses')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/licenses returns license list for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/licenses')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          licenseKeyMasked: expect.any(String),
          gameTitle: expect.any(String),
          status: expect.any(String),
        }),
      );
    }
  });

  it('GET /api/admin/licenses/:id returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/licenses/00000000-0000-0000-0000-000000000000')
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);
  });

  it('POST /api/admin/licenses returns 404 for unknown game', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/licenses')
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameId: '00000000-0000-0000-0000-000000000000', quantity: 1 })
      .expect(404);
  });

  it('POST /api/admin/licenses/generate-key returns 404 for unknown game', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/licenses/generate-key')
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameId: '00000000-0000-0000-0000-000000000000' })
      .expect(404);
  });

  it('POST /api/admin/licenses/:id/revoke returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/licenses/00000000-0000-0000-0000-000000000000/revoke')
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);
  });

  it('GET /api/admin/accounts returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/accounts returns account list for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          gameId: expect.any(String),
          gameTitle: expect.any(String),
          username: expect.any(String),
          platform: expect.any(String),
          isActive: expect.any(Boolean),
        }),
      );
    }
  });

  it('GET /api/admin/accounts/:id returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/accounts/00000000-0000-0000-0000-000000000000')
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);
  });

  it('POST /api/admin/accounts returns 404 for unknown game', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        gameId: '00000000-0000-0000-0000-000000000000',
        username: 'setup-user',
        password: 'secret',
        sharedSecret: 'shared-secret',
      })
      .expect(404);
  });

  it('POST /api/admin/accounts/:id/deactivate returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/accounts/00000000-0000-0000-0000-000000000000/deactivate')
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);
  });

  const auditSetupBody = {
    status: 'setup',
    integration: 'admin-audit',
    message: 'Admin audit log — not implemented yet',
  };

  it('GET /api/admin/audit-logs returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/audit-logs')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/audit-logs returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/audit-logs?page=1&limit=10&action=admin.game.create')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(auditSetupBody);
  });

  it('GET /api/audit-logs remains on the real admin audit endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/audit-logs')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
  });

  it('GET /api/admin/orders returns order list for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/orders')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  const igdbSearchSetupBody = {
    status: 'setup',
    integration: 'igdb',
    message: 'IGDB search — not implemented yet',
  };

  const igdbImportSetupBody = {
    status: 'setup',
    integration: 'igdb',
    message: 'IGDB import — not implemented yet',
  };

  it('GET /api/admin/igdb/search returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/igdb/search?q=halo')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/igdb/search returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/igdb/search?q=halo')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(igdbSearchSetupBody);
  });

  it('POST /api/admin/igdb/import returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/igdb/import')
      .set(authAs(E2E_TOKENS.admin))
      .send({ igdbId: 12345 })
      .expect(201);

    expect(response.body).toEqual(igdbImportSetupBody);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Admin setup API e2e tests: DATABASE_URL is not set');
}
