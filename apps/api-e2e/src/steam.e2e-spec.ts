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
    app = await createE2eApp();
    await seedE2eUsers(app);
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('GET /api/steam/health returns setup JSON', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/steam/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'setup',
      integration: 'steam',
    });
    expect(response.body.message).toMatch(/not implemented yet$/);
  });

  it('POST /api/steam/guard-code returns setup JSON', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/steam/guard-code')
      .set(authAs(E2E_TOKENS.userA))
      .send({ licenseKey: 'DEMO-KEY-0001' })
      .expect(201);

    expect(response.body).toEqual({
      status: 'setup',
      integration: 'steam',
      message: 'Steam Guard — not implemented yet',
    });
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Steam API e2e tests: DATABASE_URL is not set');
}
