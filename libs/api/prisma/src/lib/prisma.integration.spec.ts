import { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Prisma integration', () => {
  const prisma = new PrismaClient();

  it('runs SELECT 1 against the database', async () => {
    const result = await prisma.$queryRaw<Array<{ '?column?': number }>>`
      SELECT 1
    `;
    expect(result).toHaveLength(1);
    expect(Object.values(result[0] ?? {})[0]).toBe(1);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn(
    'Skipping Prisma integration tests: DATABASE_URL is not set',
  );
}
