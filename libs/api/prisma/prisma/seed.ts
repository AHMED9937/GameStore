import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const game1 = await prisma.game.upsert({
    where: { slug: 'demo-game-1' },
    update: {},
    create: {
      title: 'Stellar Odyssey',
      slug: 'demo-game-1',
      description: 'Offline activation demo title for catalog development.',
      platform: 'steam',
      priceBase: 9.99,
      coverImage: '/og/default.png',
      publishedAt: new Date(),
    },
  });

  const game2 = await prisma.game.upsert({
    where: { slug: 'demo-game-2' },
    update: {},
    create: {
      title: 'Neon Drift Rally',
      slug: 'demo-game-2',
      description: 'Second seed game for shop grid testing.',
      platform: 'steam',
      priceBase: 14.99,
      coverImage: '/og/default.png',
      publishedAt: new Date(),
    },
  });

  const game3 = await prisma.game.upsert({
    where: { slug: 'demo-game-3' },
    update: {},
    create: {
      title: 'Void Protocol',
      slug: 'demo-game-3',
      description: 'Third seed game — epic platform placeholder.',
      platform: 'epic',
      priceBase: 19.99,
      publishedAt: new Date(),
    },
  });

  await prisma.gamePricingRegion.upsert({
    where: {
      gameId_countryCode: { gameId: game1.id, countryCode: 'US' },
    },
    update: {},
    create: {
      gameId: game1.id,
      countryCode: 'US',
      priceAdjusted: 9.99,
      currency: 'USD',
    },
  });

  await prisma.gamePricingRegion.upsert({
    where: {
      gameId_countryCode: { gameId: game1.id, countryCode: 'EG' },
    },
    update: {},
    create: {
      gameId: game1.id,
      countryCode: 'EG',
      priceAdjusted: 4.99,
      currency: 'USD',
    },
  });

  for (const game of [game1, game2, game3]) {
    const existingAccount = await prisma.gameAccount.findFirst({
      where: { gameId: game.id, username: `pool-${game.slug}` },
    });
    if (!existingAccount) {
      await prisma.gameAccount.create({
        data: {
          gameId: game.id,
          platform: game.platform,
          username: `pool-${game.slug}`,
          passwordEncrypted: 'ENCRYPTED_PLACEHOLDER',
          sharedSecret: 'SHARED_SECRET_PLACEHOLDER',
          region: 'global',
        },
      });
    }
  }

  await prisma.license.upsert({
    where: { licenseKey: 'DEMO-KEY-0001' },
    update: {},
    create: {
      licenseKey: 'DEMO-KEY-0001',
      gameId: game1.id,
      status: 'available',
    },
  });

  await prisma.license.upsert({
    where: { licenseKey: 'DEMO-KEY-0002' },
    update: {},
    create: {
      licenseKey: 'DEMO-KEY-0002',
      gameId: game2.id,
      status: 'available',
    },
  });

  console.log('Seed complete:', {
    games: 3,
    pricingRegions: 2,
    licenses: 2,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
