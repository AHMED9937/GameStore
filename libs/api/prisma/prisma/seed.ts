import { PrismaClient } from '@prisma/client';
import { resolveSeedPoolCredentials } from './seed-steam-pool';

const prisma = new PrismaClient();
const seedPoolCredentials = resolveSeedPoolCredentials();

const STELLAR_DESCRIPTION = `Stellar Odyssey is a narrative-driven space adventure. Chart unknown sectors, negotiate with alien factions, and uncover the mystery behind a collapsing jump gate network.

Explore handcrafted star systems, upgrade your ship, and make choices that reshape the balance of power across the galaxy.`;

const NEON_DESCRIPTION = `Neon Drift Rally is an arcade-style racer set in a neon-soaked metropolis. Master drift chains, unlock custom body kits, and compete in nightly underground circuits.

Features 40+ tracks, split-screen support, and a synthwave soundtrack that reacts to your driving style.`;

const VOID_DESCRIPTION = `Void Protocol is a tactical stealth action game. Infiltrate corporate vaults, hack security grids, and extract data without triggering lockdown.

Each mission supports multiple approaches — ghost runs, loud breaches, or social engineering — with persistent consequences across the campaign.`;

const REQUIREMENTS_STELLAR_MIN = `Requires a 64-bit processor and operating system
OS: Windows 10/11 64-bit
Processor: Intel Core i5-8400 / AMD Ryzen 5 2600
Memory: 8 GB RAM
Graphics: NVIDIA GTX 1060 / AMD RX 580
Storage: 45 GB available space`;

const REQUIREMENTS_STELLAR_REC = `Requires a 64-bit processor and operating system
OS: Windows 10/11 64-bit
Processor: Intel Core i7-10700 / AMD Ryzen 7 3700X
Memory: 16 GB RAM
Graphics: NVIDIA RTX 3060 / AMD RX 6700 XT
Storage: 45 GB available space (SSD recommended)`;

const REQUIREMENTS_NEON_MIN = `Requires a 64-bit processor and operating system
OS: Windows 10/11 64-bit
Processor: Intel Core i3-10100 / AMD Ryzen 3 3100
Memory: 8 GB RAM
Graphics: NVIDIA GTX 1650 / AMD RX 5500 XT
Storage: 25 GB available space`;

const REQUIREMENTS_NEON_REC = `Requires a 64-bit processor and operating system
OS: Windows 10/11 64-bit
Processor: Intel Core i5-12400 / AMD Ryzen 5 5600
Memory: 16 GB RAM
Graphics: NVIDIA RTX 2060 / AMD RX 6600
Storage: 25 GB available space (SSD recommended)`;

const REQUIREMENTS_VOID_MIN = `Requires a 64-bit processor and operating system
OS: MICROSOFT WINDOWS 10/11, 64-BIT
Processor: INTEL CORE i5 9500, AMD RYZEN 5 3500
Memory: 16 GB RAM
Graphics: NVIDIA GEFORCE GTX 1660, AMD RX 5700
Storage: 80 GB available space
Additional Notes: SSD required`;

const REQUIREMENTS_VOID_REC = `Requires a 64-bit processor and operating system
OS: MICROSOFT WINDOWS 10/11, 64-BIT
Processor: INTEL CORE i5 13500, AMD RYZEN 5 7600
Memory: 16 GB RAM
Graphics: NVIDIA GEFORCE RTX 3060 TI, AMD RX 6700 XT
Storage: 80 GB available space
Additional Notes: SSD required`;

async function seedGameMedia(
  gameId: string,
  items: Array<{
    type: string;
    url: string;
    title: string;
    igdbId: number;
    sortOrder: number;
  }>,
) {
  await prisma.gameMedia.deleteMany({ where: { gameId } });
  await prisma.gameMedia.createMany({
    data: items.map((item) => ({ gameId, ...item })),
  });
}

async function main() {
  const game1 = await prisma.game.upsert({
    where: { slug: 'demo-game-1' },
    update: {
      description: STELLAR_DESCRIPTION,
      requirementsMin: REQUIREMENTS_STELLAR_MIN,
      requirementsRecommended: REQUIREMENTS_STELLAR_REC,
    },
    create: {
      title: 'Stellar Odyssey',
      slug: 'demo-game-1',
      description: STELLAR_DESCRIPTION,
      platform: 'steam',
      priceBase: 9.99,
      coverImage: '/og/default.png',
      publishedAt: new Date(),
      igdbId: 100001,
      genres: ['Adventure', 'Sci-Fi'],
      releaseDate: new Date('2024-03-15'),
      requirementsMin: REQUIREMENTS_STELLAR_MIN,
      requirementsRecommended: REQUIREMENTS_STELLAR_REC,
    },
  });

  await seedGameMedia(game1.id, [
    {
      type: 'video',
      url: 'https://www.youtube.com/embed/L_jWHffIx5E',
      title: 'Launch Trailer',
      igdbId: 920001,
      sortOrder: 0,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Gameplay Overview',
      igdbId: 920002,
      sortOrder: 1,
    },
    {
      type: 'activation',
      url: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      title: 'Steam activation walkthrough',
      igdbId: 920003,
      sortOrder: 2,
    },
    {
      type: 'screenshot',
      url: '/og/default.png',
      title: 'Screenshot 1',
      igdbId: 910001,
      sortOrder: 0,
    },
    {
      type: 'screenshot',
      url: '/og/default.png',
      title: 'Screenshot 2',
      igdbId: 910002,
      sortOrder: 1,
    },
  ]);

  const game2 = await prisma.game.upsert({
    where: { slug: 'demo-game-2' },
    update: {
      description: NEON_DESCRIPTION,
      requirementsMin: REQUIREMENTS_NEON_MIN,
      requirementsRecommended: REQUIREMENTS_NEON_REC,
    },
    create: {
      title: 'Neon Drift Rally',
      slug: 'demo-game-2',
      description: NEON_DESCRIPTION,
      platform: 'steam',
      priceBase: 14.99,
      coverImage: '/og/default.png',
      publishedAt: new Date(),
      genres: ['Racing', 'Arcade'],
      releaseDate: new Date('2023-08-01'),
      requirementsMin: REQUIREMENTS_NEON_MIN,
      requirementsRecommended: REQUIREMENTS_NEON_REC,
    },
  });

  await seedGameMedia(game2.id, [
    {
      type: 'video',
      url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      title: 'Announcement Trailer',
      igdbId: 920101,
      sortOrder: 0,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/embed/9bZkp7q19f0',
      title: 'Drift Gameplay',
      igdbId: 920102,
      sortOrder: 1,
    },
    {
      type: 'activation',
      url: 'https://www.youtube.com/embed/oHg5SJYRHA0',
      title: 'Neon Drift activation guide',
      igdbId: 920103,
      sortOrder: 2,
    },
  ]);

  const game3 = await prisma.game.upsert({
    where: { slug: 'demo-game-3' },
    update: {
      description: VOID_DESCRIPTION,
      requirementsMin: REQUIREMENTS_VOID_MIN,
      requirementsRecommended: REQUIREMENTS_VOID_REC,
    },
    create: {
      title: 'Void Protocol',
      slug: 'demo-game-3',
      description: VOID_DESCRIPTION,
      platform: 'microsoft',
      priceBase: 19.99,
      coverImage: '/og/default.png',
      publishedAt: new Date(),
      genres: ['Stealth', 'Action'],
      releaseDate: new Date('2025-01-10'),
      requirementsMin: REQUIREMENTS_VOID_MIN,
      requirementsRecommended: REQUIREMENTS_VOID_REC,
    },
  });

  await seedGameMedia(game3.id, [
    {
      type: 'video',
      url: 'https://www.youtube.com/embed/M7lc1UVf-VE',
      title: 'Reveal Trailer',
      igdbId: 920201,
      sortOrder: 0,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/embed/ktvTqknDobU',
      title: 'Stealth gameplay',
      igdbId: 920202,
      sortOrder: 1,
    },
    {
      type: 'activation',
      url: 'https://www.youtube.com/embed/FTQbiNvZqaY',
      title: 'Microsoft Store activation',
      igdbId: 920203,
      sortOrder: 2,
    },
  ]);

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
    const username = `pool-${game.slug}`;
    const existingAccount = await prisma.gameAccount.findFirst({
      where: { gameId: game.id, username },
    });

    if (existingAccount) {
      await prisma.gameAccount.update({
        where: { id: existingAccount.id },
        data: {
          passwordEncrypted: seedPoolCredentials.passwordEncrypted,
          sharedSecret: seedPoolCredentials.sharedSecret,
        },
      });
    } else {
      await prisma.gameAccount.create({
        data: {
          gameId: game.id,
          platform: game.platform,
          username,
          passwordEncrypted: seedPoolCredentials.passwordEncrypted,
          sharedSecret: seedPoolCredentials.sharedSecret,
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
    poolCredentialsEncrypted: seedPoolCredentials.isEncrypted,
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
