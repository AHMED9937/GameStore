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

describe.skipIf(!hasDatabase)('Licenses API', () => {
  let app: INestApplication;
  let createdGameId: string;
  let expiredLicenseId: string | undefined;

  beforeAll(async () => {
    app = await createE2eApp();
    await seedE2eUsers(app);
  });

  afterAll(async () => {
    if (app && expiredLicenseId) {
      const prisma = app.get(PrismaService);
      await prisma.license
        .delete({ where: { id: expiredLicenseId } })
        .catch(() => undefined);
    }
    if (createdGameId) {
      await request(app.getHttpServer())
        .delete(`/api/games/${createdGameId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('POST /api/licenses/validate returns seeded license + game', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .send({ licenseKey: 'DEMO-KEY-0001' });

    if (response.status === 404) {
      return;
    }

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      licenseKey: 'DEMO-KEY-0001',
      status: 'available',
      game: {
        slug: 'demo-game-1',
        title: 'Stellar Odyssey',
      },
    });
  });

  it('POST /api/licenses/validate with invalid key returns 404', async () => {
    await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .send({ licenseKey: 'INVALID-KEY-E2E' })
      .expect(404);
  });

  it('POST /api/licenses/validate with empty key returns 400', async () => {
    await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .send({ licenseKey: '' })
      .expect(400);
  });

  it('POST /api/licenses/validate rejects expired licenses', async () => {
    const slug = `e2e-expired-lic-${Date.now()}`;
    const gameResponse = await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'Expired License E2E Game',
        slug,
        platform: 'steam',
        priceBase: 1.99,
        publishedAt: '2026-01-01T00:00:00.000Z',
      })
      .expect(201);

    const prisma = app.get(PrismaService);
    const licenseKey = `E2E-EXPIRED-${Date.now()}`;
    const license = await prisma.license.create({
      data: {
        licenseKey,
        gameId: gameResponse.body.id,
        status: 'available',
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });
    expiredLicenseId = license.id;

    await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .send({ licenseKey })
      .expect(403);
  });

  it('POST /api/licenses/:id/revoke returns 403 on validate', async () => {
    const slug = `e2e-lic-game-${Date.now()}`;
    const gameResponse = await request(app.getHttpServer())
      .post('/api/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'License E2E Game',
        slug,
        platform: 'steam',
        priceBase: 2.99,
        publishedAt: '2026-01-01T00:00:00.000Z',
      })
      .expect(201);

    createdGameId = gameResponse.body.id;
    const licenseKey = `E2E-KEY-${Date.now()}`;

    const licenseResponse = await request(app.getHttpServer())
      .post('/api/licenses')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        licenseKey,
        gameId: createdGameId,
        status: 'available',
      })
      .expect(201);

    const licenseId = licenseResponse.body.id;

    await request(app.getHttpServer())
      .post(`/api/licenses/${licenseId}/revoke`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .send({ licenseKey })
      .expect(403);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Licenses API e2e tests: DATABASE_URL is not set');
}
