import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeE2eApp, createE2eApp } from './support/e2e-app';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('GET /api/health/db', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('returns ok with latencyMs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health/db')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok' });
    expect(typeof response.body.latencyMs).toBe('number');
    expect(response.body.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping API e2e tests: DATABASE_URL is not set');
}
