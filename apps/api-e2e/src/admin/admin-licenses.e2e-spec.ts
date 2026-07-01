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

describe.skipIf(!hasDatabase)('Admin licenses API', () => {
  let app: INestApplication;
  let gameId = '';
  let createdLicenseId = '';
  let createdLicenseKey = '';

  beforeAll(async () => {
    app = await createE2eApp();
    await seedE2eUsers(app);

    const gamesResponse = await request(app.getHttpServer())
      .get('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    gameId = gamesResponse.body[0]?.id;
    expect(gameId).toBeTruthy();
  });

  afterAll(async () => {
    if (createdLicenseId) {
      await request(app.getHttpServer())
        .post(`/api/admin/licenses/${createdLicenseId}/revoke`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
    }
    await closeE2eApp(app);
  });

  it('POST /api/admin/licenses/generate-key creates an available license', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/licenses/generate-key')
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameId, buyerEmail: 'e2e-buyer@example.com' })
      .expect(201);

    createdLicenseId = response.body.id;
    createdLicenseKey = response.body.licenseKey;

    expect(response.body).toMatchObject({
      gameId,
      status: 'available',
      buyerEmail: 'e2e-buyer@example.com',
    });
    expect(response.body.licenseKey).toMatch(
      /^GS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/,
    );
  });

  it('GET /api/admin/licenses includes the generated license', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/licenses')
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdLicenseId,
          gameTitle: expect.any(String),
          status: 'available',
        }),
      ]),
    );
  });

  it('GET /api/admin/licenses/:id returns full license key for admin copy', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/admin/licenses/${createdLicenseId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body).toMatchObject({
      id: createdLicenseId,
      licenseKey: createdLicenseKey,
      gameId,
      status: 'available',
      buyerEmail: 'e2e-buyer@example.com',
    });
  });

  it('POST /api/licenses/validate accepts the generated key', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/licenses/validate')
      .send({ licenseKey: createdLicenseKey })
      .expect(200);

    expect(response.body).toMatchObject({
      licenseKey: createdLicenseKey,
      status: 'available',
    });
  });

  it('POST /api/admin/licenses/:id/revoke marks license revoked', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/admin/licenses/${createdLicenseId}/revoke`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(response.body.status).toBe('revoked');
    createdLicenseId = '';
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Admin licenses API e2e tests: DATABASE_URL is not set');
}
