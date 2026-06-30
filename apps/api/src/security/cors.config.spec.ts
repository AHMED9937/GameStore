import { describe, expect, it } from 'vitest';
import { buildCorsOptions, parseCorsOrigins } from './cors.config';

function checkOrigin(
  options: ReturnType<typeof buildCorsOptions>,
  origin: string | undefined,
): Promise<boolean> {
  const handler = options.origin;
  if (typeof handler !== 'function') {
    return Promise.reject(new Error('expected dynamic CORS origin handler'));
  }

  return new Promise((resolve, reject) => {
    handler(origin, (err, allowed) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(!!allowed);
    });
  });
}

describe('cors.config', () => {
  it('parseCorsOrigins splits and trims CORS_ORIGINS', () => {
    expect(
      parseCorsOrigins('https://gamestore.com, http://localhost:3000 ', 'production'),
    ).toEqual(['https://gamestore.com', 'http://localhost:3000']);
  });

  it('parseCorsOrigins uses dev defaults outside production', () => {
    expect(parseCorsOrigins(undefined, 'development')).toEqual([
      'http://localhost:3000',
      'http://localhost:4200',
    ]);
  });

  it('parseCorsOrigins returns empty list in production when unset', () => {
    expect(parseCorsOrigins(undefined, 'production')).toEqual([]);
  });

  it('buildCorsOptions allows listed origins only', async () => {
    const options = buildCorsOptions({
      corsOrigins: 'http://localhost:3000',
      nodeEnv: 'development',
    });

    await expect(checkOrigin(options, 'http://localhost:3000')).resolves.toBe(true);
    await expect(checkOrigin(options, 'https://evil.example')).rejects.toThrow(
      /not allowed by CORS/i,
    );
    await expect(checkOrigin(options, undefined)).resolves.toBe(true);
  });
});
