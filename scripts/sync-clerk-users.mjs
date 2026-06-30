/**
 * One-time / dev sync: pull all users from Clerk → upsert into Neon `users` table.
 * Run: npx tsx scripts/sync-clerk-users.mjs
 */
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';

function parseRole(metadata) {
  if (metadata?.role === 'admin') return 'admin';
  return 'user';
}

function primaryEmail(user) {
  const addresses = user.emailAddresses ?? [];
  if (addresses.length === 0) return null;
  const primaryId = user.primaryEmailAddressId;
  if (primaryId) {
    const primary = addresses.find((e) => e.id === primaryId);
    if (primary?.emailAddress) return primary.emailAddress;
  }
  return addresses[0]?.emailAddress ?? null;
}

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  console.error('Missing CLERK_SECRET_KEY in .env');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey });
const prisma = new PrismaClient();

let offset = 0;
const limit = 100;
let total = 0;

while (true) {
  const { data, totalCount } = await clerk.users.getUserList({ limit, offset });
  if (data.length === 0) break;

  for (const user of data) {
    const email = primaryEmail(user);
    if (!email) {
      console.warn(`Skip ${user.id}: no email`);
      continue;
    }

    const role = parseRole(user.publicMetadata);
    const firstName = user.firstName?.trim() || null;
    const lastName = user.lastName?.trim() || null;
    await prisma.user.upsert({
      where: { clerkId: user.id },
      create: { clerkId: user.id, email, role, firstName, lastName },
      update: { email, role, firstName, lastName },
    });
    console.log(`Synced: ${email} (${role})`);
    total += 1;
  }

  offset += data.length;
  if (offset >= totalCount) break;
}

console.log(`\nDone. Synced ${total} user(s) from Clerk to Neon.`);
await prisma.$disconnect();
