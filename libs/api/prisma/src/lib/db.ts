import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  gamestorePrisma?: PrismaClient;
};

function createDbClient() {
  const databaseUrl = process.env['DATABASE_URL'];

  return new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
    ...(databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : {}),
  });
}

export const db = globalForPrisma.gamestorePrisma ?? createDbClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.gamestorePrisma = db;
}
