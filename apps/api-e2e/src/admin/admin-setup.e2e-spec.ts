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

  const gamesSetupBody = {
    status: 'setup',
    integration: 'admin-games',
    message: 'Admin games — not implemented yet',
  };

  it('GET /api/admin/games returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/games')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/games returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(gamesSetupBody);
  });

  it('GET /api/admin/games/:id returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/games/some-id')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(gamesSetupBody);
  });

  it('POST /api/admin/games returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({ title: 'Setup Game', slug: 'setup-game', platform: 'steam' })
      .expect(201);

    expect(response.body).toEqual(gamesSetupBody);
  });

  it('PUT /api/admin/games/:id returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/admin/games/some-id')
      .set(authAs(E2E_TOKENS.admin))
      .send({ title: 'Updated' })
      .expect(200);

    expect(response.body).toEqual(gamesSetupBody);
  });

  it('DELETE /api/admin/games/:id returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/admin/games/some-id')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(gamesSetupBody);
  });

  it('GET /api/games remains public and unchanged', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/games')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  const licensesSetupBody = {
    status: 'setup',
    integration: 'admin-licenses',
    message: 'Admin licenses — not implemented yet',
  };

  it('GET /api/admin/licenses returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/licenses')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/licenses returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/licenses')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(licensesSetupBody);
  });

  it('GET /api/admin/licenses/:id returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/licenses/some-id')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(licensesSetupBody);
  });

  it('POST /api/admin/licenses returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/licenses')
      .set(authAs(E2E_TOKENS.admin))
      .send({ licenseKey: 'SETUP-KEY', gameId: 'game-id' })
      .expect(201);

    expect(response.body).toEqual(licensesSetupBody);
  });

  it('POST /api/admin/licenses/generate-key returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/licenses/generate-key')
      .set(authAs(E2E_TOKENS.admin))
      .expect(201);

    expect(response.body).toEqual(licensesSetupBody);
  });

  it('POST /api/admin/licenses/:id/revoke returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/licenses/some-id/revoke')
      .set(authAs(E2E_TOKENS.admin))
      .expect(201);

    expect(response.body).toEqual(licensesSetupBody);
  });

  const accountsSetupBody = {
    status: 'setup',
    integration: 'admin-accounts',
    message: 'Admin accounts — not implemented yet',
  };

  it('GET /api/admin/accounts returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.userA))
      .expect(403);
  });

  it('GET /api/admin/accounts returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(accountsSetupBody);
  });

  it('GET /api/admin/accounts/:id returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/accounts/some-id')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(accountsSetupBody);
  });

  it('POST /api/admin/accounts returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        gameId: 'game-id',
        platform: 'steam',
        username: 'setup-user',
        passwordEncrypted: 'enc',
        sharedSecret: 'secret',
      })
      .expect(201);

    expect(response.body).toEqual(accountsSetupBody);
  });

  it('POST /api/admin/accounts/:id/deactivate returns setup JSON for an admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/accounts/some-id/deactivate')
      .set(authAs(E2E_TOKENS.admin))
      .expect(201);

    expect(response.body).toEqual(accountsSetupBody);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Admin setup API e2e tests: DATABASE_URL is not set');
}
