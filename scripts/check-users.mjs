import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  select: { email: true, role: true, clerkId: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
});

console.log(`Users in Neon: ${users.length}`);
for (const user of users) {
  console.log(` - ${user.email} (${user.role})`);
}

await prisma.$disconnect();
