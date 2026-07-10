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
const TEST_ENCRYPTION_KEY = 'c'.repeat(64);
const TEST_PASSWORD = 'admin-path-steam-password';
const TEST_SHARED_SECRET = 'testsharedsecretfortotp123456';

describe.skipIf(!hasDatabase)('Admin license → activation → Steam Guard', () => {
  let app: INestApplication;
  let createdGameId = '';
  let licenseKey = '';
  let licenseId = '';

  beforeAll(async () => {
    process.env.STEAM_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    process.env.STEAM_GUARD_COOLDOWN_MINUTES = '1';

    app = await createE2eApp();
    await seedE2eUsers(app);

    const slug = `e2e-admin-act-${Date.now()}`;
    const gameResponse = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'Admin Activation E2E Game',
        slug,
        platform: 'steam',
        priceBase: 9.99,
        description:
          'A long enough description for admin activation e2e testing path.',
        coverImage: '/og/default.png',
        genres: ['Adventure'],
        published: true,
      })
      .expect(201);

    createdGameId = gameResponse.body.id;

    await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        gameId: createdGameId,
        username: `pool-${slug}`,
        password: TEST_PASSWORD,
        sharedSecret: TEST_SHARED_SECRET,
        region: 'global',
      })
      .expect(201);

    const licenseResponse = await request(app.getHttpServer())
      .post('/api/admin/licenses/generate-key')
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameId: createdGameId, buyerEmail: 'admin-path@example.com' })
      .expect(201);

    licenseKey = licenseResponse.body.licenseKey;
    licenseId = licenseResponse.body.id;
    expect(licenseKey).toMatch(/^GS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
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

  it('POST /api/licenses/validate accepts admin-generated key', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey })
      .expect(200);

    expect(response.body).toMatchObject({
      licenseKey,
      status: 'available',
      game: { id: createdGameId },
    });
  });

  it('POST /api/licenses/activate returns decrypted pool credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/licenses/activate')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey })
      .expect(200);

    expect(response.body).toMatchObject({
      licenseKey,
      status: 'activated',
      account: {
        username: expect.any(String),
        password: TEST_PASSWORD,
      },
    });
  });

  it('POST /api/steam/guard-code returns live TOTP', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/steam/guard-code')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey })
      .expect(201);

    expect(response.body.code).toMatch(/^[A-Z0-9]{5}$/);
    expect(response.body.expiresInSeconds).toBeGreaterThan(0);
  });

  it('POST /api/admin/licenses/:id/revoke releases pool slot after activation', async () => {
    const accountsBefore = await request(app.getHttpServer())
      .get(`/api/admin/accounts?gameId=${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(accountsBefore.body[0].activeUsersCount).toBe(1);

    await request(app.getHttpServer())
      .post(`/api/admin/licenses/${licenseId}/revoke`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    const accountsAfter = await request(app.getHttpServer())
      .get(`/api/admin/accounts?gameId=${createdGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(accountsAfter.body[0].activeUsersCount).toBe(0);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn(
    'Skipping admin activation API e2e tests: DATABASE_URL is not set',
  );
}
