import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  gamestorePrisma?: PrismaClient;
};

function createDbClient() {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL must be a Neon PostgreSQL connection string (see Clerk Neon integration guide).',
    );
  }

  return new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url: databaseUrl },
    },
  });
}

export const db = globalForPrisma.gamestorePrisma ?? createDbClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.gamestorePrisma = db;
}
