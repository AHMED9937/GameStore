/**
 * Remove Neon users that no longer exist in Clerk (e.g. deleted from Clerk Dashboard).
 * Run: npx tsx scripts/prune-stale-neon-users.mjs
 */
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const clerkSecret = process.env.CLERK_SECRET_KEY;

if (!clerkSecret) {
  throw new Error('CLERK_SECRET_KEY is required');
}

const clerk = createClerkClient({ secretKey: clerkSecret });

const clerkIds = new Set();
let offset = 0;
const limit = 100;

while (true) {
  const page = await clerk.users.getUserList({ limit, offset });
  for (const user of page.data) {
    clerkIds.add(user.id);
  }
  if (page.data.length < limit) {
    break;
  }
  offset += limit;
}

const neonUsers = await prisma.user.findMany({
  select: { id: true, clerkId: true, email: true },
});

const stale = neonUsers.filter((user) => !clerkIds.has(user.clerkId));

console.log(`Clerk users: ${clerkIds.size}`);
console.log(`Neon users: ${neonUsers.length}`);
console.log(`Stale Neon users (not in Clerk): ${stale.length}`);

for (const user of stale) {
  await prisma.user.delete({ where: { id: user.id } });
  console.log(` - removed ${user.email} (${user.clerkId})`);
}

await prisma.$disconnect();
