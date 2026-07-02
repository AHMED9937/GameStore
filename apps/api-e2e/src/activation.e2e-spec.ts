import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '@gamestore/api/prisma';
import { SteamCryptoService } from '@gamestore/api/steam';
import {
  authAs,
  closeE2eApp,
  createE2eApp,
  seedE2eUsers,
} from './support/e2e-app';
import { E2E_TOKENS } from './support/e2e-auth.tokens';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const TEST_ENCRYPTION_KEY = 'b'.repeat(64);

describe.skipIf(!hasDatabase)('License activation + Steam Guard API', () => {
  let app: INestApplication;
  let createdGameId = '';
  let createdAccountId = '';
  let licenseKey = '';
  let licenseId = '';
  let ownerUserId = '';

  beforeAll(async () => {
    process.env.STEAM_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    process.env.STEAM_GUARD_COOLDOWN_MINUTES = '1';

    app = await createE2eApp();
    const users = await seedE2eUsers(app);
    ownerUserId = users.userA.id;

    const crypto = new SteamCryptoService();
    const encryptedPassword = crypto.encrypt('test-steam-password');
    const encryptedSecret = crypto.encrypt('testsharedsecretfortotp123456');

    const slug = `e2e-activation-${Date.now()}`;
    const gameResponse = await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'Activation E2E Game',
        slug,
        platform: 'steam',
        priceBase: 4.99,
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
        username: `e2e-pool-${Date.now()}`,
        password: 'test-steam-password',
        sharedSecret: 'testsharedsecretfortotp123456',
      })
      .expect(201);

    createdAccountId = accountResponse.body.id;
    licenseKey = `E2E-ACT-${Date.now()}`;

    const prisma = app.get(PrismaService);
    const license = await prisma.license.create({
      data: {
        licenseKey,
        gameId: createdGameId,
        status: 'available',
        ownerId: ownerUserId,
      },
    });
    licenseId = license.id;

    expect(encryptedPassword).toMatch(/^v1:/);
    expect(encryptedSecret).toMatch(/^v1:/);
  });

  afterAll(async () => {
    if (app && licenseId) {
      const prisma = app.get(PrismaService);
      await prisma.license.delete({ where: { id: licenseId } }).catch(() => undefined);
    }
    if (app && createdGameId) {
      await request(app.getHttpServer())
        .delete(`/api/games/${createdGameId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('POST /api/licenses/validate never returns password', async () => {
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
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('account');
  });

  it('user B cannot activate user A license', async () => {
    await request(app.getHttpServer())
      .post('/api/licenses/activate')
      .set(authAs(E2E_TOKENS.userB))
      .send({ licenseKey })
      .expect(403);
  });

  it('user A activates license and receives credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/licenses/activate')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey })
      .expect(200);

    expect(response.body).toMatchObject({
      licenseKey,
      status: 'activated',
      game: { id: createdGameId },
      account: {
        username: expect.any(String),
        password: 'test-steam-password',
      },
    });
  });

  it('reactivating returns same credentials for owner', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/licenses/activate')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey })
      .expect(200);

    expect(response.body.account.password).toBe('test-steam-password');
  });

  it('POST /api/steam/guard-code returns live TOTP for activated license', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/steam/guard-code')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey })
      .expect(201);

    expect(response.body.code).toMatch(/^[A-Z0-9]{5}$/);
    expect(response.body.expiresInSeconds).toBeGreaterThan(0);
    expect(response.body.expiresInSeconds).toBeLessThanOrEqual(30);
  });

  it('user B cannot request guard code for user A license', async () => {
    await request(app.getHttpServer())
      .post('/api/steam/guard-code')
      .set(authAs(E2E_TOKENS.userB))
      .send({ licenseKey })
      .expect(403);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn(
    'Skipping activation API e2e tests: DATABASE_URL is not set',
  );
}
