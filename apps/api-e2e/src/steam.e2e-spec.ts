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

describe.skipIf(!hasDatabase)('Steam routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.STEAM_ENCRYPTION_KEY = 'c'.repeat(64);
    app = await createE2eApp();
    await seedE2eUsers(app);
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('GET /api/steam/health returns configured status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/steam/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      integration: 'steam',
      encryption: 'valid',
    });
  });

  it('POST /api/steam/guard-code requires licenseKey when configured', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/steam/guard-code')
      .set(authAs(E2E_TOKENS.userA))
      .send({})
      .expect(400);

    expect(response.body.message).toMatch(/licenseKey/i);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Steam API e2e tests: DATABASE_URL is not set');
}
