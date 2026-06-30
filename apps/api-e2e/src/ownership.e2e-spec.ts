import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '@gamestore/api/prisma';
import {
  authAs,
  closeE2eApp,
  createE2eApp,
  seedE2eUsers,
} from './support/e2e-app';
import { E2E_TOKENS } from './support/e2e-auth.tokens';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Security ownership API', () => {
  let app: INestApplication;
  let createdGameId = '';
  let ownedLicenseKey = '';
  let ownedLicenseId = '';

  beforeAll(async () => {
    app = await createE2eApp();
    const users = await seedE2eUsers(app);
    const prisma = app.get(PrismaService);

    const slug = `e2e-own-game-${Date.now()}`;
    const gameResponse = await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'Ownership E2E Game',
        slug,
        platform: 'steam',
        priceBase: 3.99,
        publishedAt: '2026-01-01T00:00:00.000Z',
      })
      .expect(201);

    createdGameId = gameResponse.body.id;
    ownedLicenseKey = `E2E-OWN-${Date.now()}`;

    const license = await prisma.license.create({
      data: {
        licenseKey: ownedLicenseKey,
        gameId: createdGameId,
        status: 'available',
        ownerId: users.userA.id,
      },
    });
    ownedLicenseId = license.id;
  });

  afterAll(async () => {
    if (app && ownedLicenseId) {
      const prisma = app.get(PrismaService);
      await prisma.license.delete({ where: { id: ownedLicenseId } }).catch(() => undefined);
    }
    if (app && createdGameId) {
      await request(app.getHttpServer())
        .delete(`/api/games/${createdGameId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('user B cannot validate user A owned license', async () => {
    await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .set(authAs(E2E_TOKENS.userB))
      .send({ licenseKey: ownedLicenseKey })
      .expect(403);
  });

  it('user A can validate their own license', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey: ownedLicenseKey })
      .expect(200);

    expect(response.body).toMatchObject({
      licenseKey: ownedLicenseKey,
      status: 'available',
    });
  });

  it('GET /api/licenses/mine lists only the current user licenses', async () => {
    const userAResponse = await request(app.getHttpServer())
      .get('/api/licenses/mine')
      .set(authAs(E2E_TOKENS.userA))
      .expect(200);

    expect(userAResponse.body.some(
      (entry: { licenseKey: string }) => entry.licenseKey === ownedLicenseKey,
    )).toBe(true);

    const userBResponse = await request(app.getHttpServer())
      .get('/api/licenses/mine')
      .set(authAs(E2E_TOKENS.userB))
      .expect(200);

    expect(userBResponse.body.some(
      (entry: { licenseKey: string }) => entry.licenseKey === ownedLicenseKey,
    )).toBe(false);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Security ownership API e2e tests: DATABASE_URL is not set');
}
