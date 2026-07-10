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

const SECRET_FIELDS = ['passwordEncrypted', 'sharedSecret'];

describe.skipIf(!hasDatabase)('Game accounts API', () => {
  let app: INestApplication;
  let createdGameId: string;
  let createdAccountId: string;

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

  it('GET /api/game-accounts omits secret fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/game-accounts')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    for (const account of response.body) {
      for (const field of SECRET_FIELDS) {
        expect(account).not.toHaveProperty(field);
      }
      expect(account).toMatchObject({
        id: expect.any(String),
        username: expect.any(String),
        platform: expect.any(String),
      });
      expect(
        account.gameId === null || typeof account.gameId === 'string',
      ).toBe(true);
    }
  });

  it('GET /api/game-accounts/:id returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/api/game-accounts/nonexistent-id-e2e')
      .set(authAs(E2E_TOKENS.admin))
      .expect(404);
  });

  it('POST create → POST deactivate sets isActive false', async () => {
    const slug = `e2e-acct-game-${Date.now()}`;
    const gameResponse = await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'Account E2E Game',
        slug,
        platform: 'steam',
        priceBase: 3.99,
        publishedAt: '2026-01-01T00:00:00.000Z',
      })
      .expect(201);

    createdGameId = gameResponse.body.id;

    const accountResponse = await request(app.getHttpServer())
      .post('/api/game-accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        gameId: createdGameId,
        platform: 'steam',
        username: `e2e-user-${Date.now()}`,
        passwordEncrypted: 'ENCRYPTED_PLACEHOLDER',
        sharedSecret: 'SHARED_SECRET_PLACEHOLDER',
      })
      .expect(201);

    createdAccountId = accountResponse.body.id;
    expect(accountResponse.body.isActive).toBe(true);
    for (const field of SECRET_FIELDS) {
      expect(accountResponse.body).not.toHaveProperty(field);
    }

    const deactivateResponse = await request(app.getHttpServer())
      .post(`/api/game-accounts/${createdAccountId}/deactivate`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(201);

    expect(deactivateResponse.body.isActive).toBe(false);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Game accounts API e2e tests: DATABASE_URL is not set');
}
