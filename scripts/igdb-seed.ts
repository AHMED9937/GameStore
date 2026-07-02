/**
 * Bulk IGDB import for local dev seeding.
 * Run: pnpm nx run api-prisma:igdb-seed -- --igdb-id=12345 --slug=my-game
 */
import { PrismaClient } from '@prisma/client';
import { IgdbClient, IgdbConfig, importIgdbGame } from '@gamestore/api/igdb';

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function usage(): never {
  console.error(
    'Usage: pnpm nx run api-prisma:igdb-seed -- --igdb-id=12345 [--slug=my-game] [--platform=steam] [--price=9.99]',
  );
  process.exit(1);
}

const igdbIdRaw = readArg('igdb-id');
if (!igdbIdRaw) {
  usage();
}

const igdbId = Number.parseInt(igdbIdRaw, 10);
if (!Number.isFinite(igdbId) || igdbId < 1) {
  console.error('Invalid --igdb-id value');
  process.exit(1);
}

if (!IgdbConfig.isConfigured()) {
  console.error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET in .env');
  process.exit(1);
}

const slug = readArg('slug');
const platform = readArg('platform') ?? 'steam';
const priceRaw = readArg('price') ?? '9.99';
const priceBase = Number.parseFloat(priceRaw);
if (!Number.isFinite(priceBase) || priceBase < 0) {
  console.error('Invalid --price value');
  process.exit(1);
}

const prisma = new PrismaClient();
const client = new IgdbClient();

try {
  const game = await importIgdbGame(prisma, client, {
    igdbId,
    slug,
    platform,
    priceBase,
  });

  console.log(
    JSON.stringify(
      {
        status: 'imported',
        game,
      },
      null,
      2,
    ),
  );
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'IGDB seed failed';
  console.error(message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
