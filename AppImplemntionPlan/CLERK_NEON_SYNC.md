# Clerk ↔ Neon User Sync

**Clerk is the source of truth** for identity. **Neon `users` table mirrors** Clerk.

Aligned with:

- [Clerk Integrate Neon Postgres](https://clerk.com/docs/guides/development/integrations/databases/neon) (`auth().userId` → Neon)
- [Clerk Sync data with webhooks](https://clerk.com/docs/guides/development/webhooks/syncing) (`user.created` / `updated` / `deleted`)

Parent: [SECURITY_PLAN.md](./SECURITY_PLAN.md)

---

## How GameStore differs from the Clerk Neon tutorial

| Clerk Neon tutorial | GameStore |
|---------------------|-----------|
| Drizzle ORM | **Prisma** (same Neon `DATABASE_URL`) |
| `user_id` on every table | Central **`users`** table with `clerkId` |
| Only `auth().userId` at runtime | **Webhooks** + **JIT sync on login** |
| `auth.protect()` on all routes | Public storefront + protected `/my-games`, `/admin` |

We use **both** patterns: Clerk's `userId` for identity, plus a mirrored `users` row for roles, ownership, and admin.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CLERK (source of truth)                                         │
│  Sign-up · Profile edit · Admin invite · Delete account          │
└───────────────┬───────────────────────────────┬─────────────────┘
                │ webhooks (sign-up / updates)    │ auth().userId
                ▼                                 ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│  POST /api/webhooks        │         │  ensureDbUser()            │
│  (verifyWebhook → upsert)  │         │  POST /api/users/sync      │
└───────────────┬───────────┘         │  GET  /api/users/me        │
                │                     └─────────────┬─────────────┘
                └──────────────┬────────────────────┘
                               ▼
                ┌──────────────────────────┐
                │  applyClerkUserEvent()    │
                │  libs/api/auth/sync.ts    │
                └──────────────┬───────────┘
                               ▼
                ┌──────────────────────────┐
                │  Neon · users table       │
                │  clerkId · email · role   │
                └──────────────────────────┘
```

---

## Required `.env` (Clerk + Neon)

```env
# Neon pooled URL for runtime (from Neon console)
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

---

## User CRUD mapping (both systems)

| Action in **Clerk** | Neon effect | How |
|---------------------|-------------|-----|
| Sign up | INSERT | `user.created` webhook |
| Change email / metadata | UPDATE | `user.updated` webhook |
| Change first / last name | UPDATE | `/account` → **Save profile** or `PATCH /api/users/me` |
| Delete account | DELETE | `user.deleted` webhook |
| Login (webhook missed) | UPSERT | `ensureDbUser()` on `/api/users/sync` |
| Delete account (in app) | DELETE | `DELETE /api/users/me` then `user.delete()` on `/account` |
| Delete in Clerk Dashboard | DELETE | `user.deleted` webhook → `/api/webhooks` |

**Rule:** Never INSERT users only in Neon. Create in Clerk first; Neon mirrors.

---

## Clerk Dashboard setup

### 1. Webhooks (automatic sync on sign-up)

1. **Webhooks** → **Add endpoint**
2. **URL (local):** `ngrok http 3000` → `https://YOUR-NGROK/api/webhooks`
3. **URL (prod):** `https://yourdomain.com/api/webhooks`
4. **Events:** `user.created`, `user.updated`, `user.deleted`
5. Signing secret → `CLERK_WEBHOOK_SECRET`

### 2. Session token (admin routes)

**Sessions** → **Customize session token**:

```json
{ "metadata": "{{user.public_metadata}}" }
```

---

## Code pattern (Clerk Neon + our mirror)

Server-only helper use in Server Actions / API routes:

```typescript
import { ensureDbUser, getClerkUserId } from '@/lib/clerk-neon';

// Clerk Neon style: auth() gives clerk user id
const clerkId = await getClerkUserId();

// GameStore: get Neon row (JIT sync if missing)
const dbUser = await ensureDbUser();
// dbUser.id     → use for License.ownerId, Order.ownerId
// dbUser.clerkId → matches Clerk auth().userId
```

---

## Verify sync

```bash
npx tsx scripts/check-users.mjs
```

After sign-in, call (while logged in):

```bash
curl -b cookies.txt http://localhost:3000/api/users/me
```

Backfill existing Clerk users:

```bash
npx tsx scripts/sync-clerk-users.mjs
```

Remove Neon rows for users already deleted in Clerk Dashboard:

```bash
npx tsx scripts/prune-stale-neon-users.mjs
```

---

## Code locations

| File | Role |
|------|------|
| `apps/web/src/lib/clerk-neon.ts` | **`auth()` → Neon user** (Clerk Neon pattern) |
| `libs/api/auth/src/sync.ts` | Framework-agnostic upsert/delete (import from Next) |
| `libs/api/prisma/src/lib/db.ts` | Prisma client for Next.js → Neon |
| `apps/web/src/app/api/webhooks/route.ts` | Clerk webhooks |
| `apps/web/src/app/api/users/sync/route.ts` | POST sync on login |
| `apps/web/src/app/api/users/me/route.ts` | GET current Neon user |
| `auth-redirect-handler.tsx` | Calls POST `/api/users/sync` after login |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Neon count 0 after sign-up | Webhook → `/api/webhooks` on port **3000** |
| User in Clerk, not Neon | Sign in again or run `sync-clerk-users.mjs` |
| User deleted in Clerk, still in Neon | Use **Account → Delete** in app, or enable `user.deleted` webhook |
| `DATABASE_URL` error | Set Neon pooled connection string in `.env` |
| Admin can't access `/admin` | Set `publicMetadata.role = "admin"` + session token JSON |
