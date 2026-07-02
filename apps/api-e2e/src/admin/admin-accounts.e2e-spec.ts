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
const TEST_ENCRYPTION_KEY = 'f'.repeat(64);
const TEST_PASSWORD = 'admin-accounts-e2e-password';
const TEST_SHARED_SECRET = 'testsharedsecretfortotp123456';

describe.skipIf(!hasDatabase)('Admin accounts API', () => {
  let app: INestApplication;
  let steamGameId = '';
  let createdAccountId = '';
  let secondAccountId = '';
  const slug = `e2e-admin-accounts-${Date.now()}`;

  beforeAll(async () => {
    process.env.STEAM_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

    app = await createE2eApp();
    await seedE2eUsers(app);

    const gameResponse = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'Admin Accounts E2E Game',
        slug,
        platform: 'steam',
        priceBase: 9.99,
        description:
          'A long enough description for admin accounts e2e testing path.',
        coverImage: '/og/default.png',
        genres: ['Adventure'],
        published: false,
      })
      .expect(201);

    steamGameId = gameResponse.body.id;
  });

  afterAll(async () => {
    if (steamGameId) {
      await request(app.getHttpServer())
        .delete(`/api/admin/games/${steamGameId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('POST /api/admin/accounts creates an encrypted pool account', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        gameId: steamGameId,
        username: `pool-${slug}`,
        password: TEST_PASSWORD,
        sharedSecret: TEST_SHARED_SECRET,
        region: 'global',
      })
      .expect(201);

    createdAccountId = response.body.id;

    expect(response.body).toMatchObject({
      gameId: steamGameId,
      username: `pool-${slug}`,
      platform: 'steam',
      region: 'global',
      isActive: true,
    });
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordEncrypted');
    expect(response.body).not.toHaveProperty('sharedSecret');
  });

  it('GET /api/admin/accounts never returns secret fields', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/admin/accounts?gameId=${steamGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createdAccountId }),
      ]),
    );

    for (const account of response.body) {
      expect(account).not.toHaveProperty('password');
      expect(account).not.toHaveProperty('passwordEncrypted');
      expect(account).not.toHaveProperty('sharedSecret');
    }
  });

  it('GET /api/admin/accounts/:id returns account detail', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/admin/accounts/${createdAccountId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toMatchObject({
      id: createdAccountId,
      gameId: steamGameId,
      username: `pool-${slug}`,
    });
  });

  it('PUT /api/admin/accounts/:id updates username and region', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/admin/accounts/${createdAccountId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({
        username: `pool-${slug}-updated`,
        region: 'eu',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: createdAccountId,
      username: `pool-${slug}-updated`,
      region: 'eu',
    });
  });

  it('POST /api/admin/accounts/:id/deactivate marks account inactive', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/admin/accounts/${createdAccountId}/deactivate`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(201);

    expect(response.body.isActive).toBe(false);
  });

  it('POST /api/admin/accounts/:id/reactivate marks account active', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/admin/accounts/${createdAccountId}/reactivate`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(201);

    expect(response.body.isActive).toBe(true);
  });

  it('POST /api/admin/accounts/bulk-deactivate marks multiple accounts inactive', async () => {
    const secondResponse = await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        gameId: steamGameId,
        username: `pool-${slug}-second`,
        password: TEST_PASSWORD,
        sharedSecret: TEST_SHARED_SECRET,
        region: 'global',
      })
      .expect(201);

    secondAccountId = secondResponse.body.id;

    const bulkResponse = await request(app.getHttpServer())
      .post('/api/admin/accounts/bulk-deactivate')
      .set(authAs(E2E_TOKENS.admin))
      .send({ ids: [createdAccountId, secondAccountId] })
      .expect(200);

    expect(bulkResponse.body).toEqual({
      succeeded: [createdAccountId, secondAccountId],
      failed: [],
    });

    const listResponse = await request(app.getHttpServer())
      .get(`/api/admin/accounts?gameId=${steamGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    for (const account of listResponse.body.filter(
      (row: { id: string }) =>
        row.id === createdAccountId || row.id === secondAccountId,
    )) {
      expect(account.isActive).toBe(false);
    }
  });

  it('DELETE /api/admin/accounts/:id removes the pool account', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/admin/accounts/${createdAccountId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual({
      id: createdAccountId,
      deleted: true,
    });

    await request(app.getHttpServer())
      .get(`/api/admin/accounts/${createdAccountId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);

    createdAccountId = '';

    if (secondAccountId) {
      await request(app.getHttpServer())
        .delete(`/api/admin/accounts/${secondAccountId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
      secondAccountId = '';
    }
  });

  it('POST /api/admin/accounts returns 400 for non-Steam games', async () => {
    const gamesResponse = await request(app.getHttpServer())
      .get('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    const msGame = gamesResponse.body.find(
      (game: { platform: string }) => game.platform === 'microsoft',
    );
    expect(msGame?.id).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        gameId: msGame.id,
        username: 'pool-ms',
        password: TEST_PASSWORD,
        sharedSecret: TEST_SHARED_SECRET,
      })
      .expect(400);
  });
});
