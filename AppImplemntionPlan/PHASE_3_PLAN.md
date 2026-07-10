# Phase 3 Prisma + Neon Database Plan

This document is the **detailed execution plan for Phase 3** of GameStore. It expands [implementation_plan.md](./implementation_plan.md) into reviewable slices.

**Parent plan:** [implementation_plan.md](./implementation_plan.md)  
**Previous phase:** [PHASE_2_PLAN.md](./PHASE_2_PLAN.md) (✅ complete)

---

## Phase 3 goal

Install **Prisma**, connect to **Neon PostgreSQL**, define the **initial schema**, run **migrations**, add a **seed script**, and verify connectivity with a **real health query** no fake DB layer in application code.

**Not in Phase 3:** full game CRUD wiring to the storefront (Phase 6), Stripe/Steam implementation, full SEO metadata, business rules (queues, PPP logic).

---

## Prerequisites (must be complete)

| Phase / item | Status | Notes |
|---|---|---|
| Phase 0 Nx + `@gamestore/workspace` | ✅ Done | `integration-lib` generator exists |
| Phase 1 Theme + UI | ✅ Done | |
| Phase 2 Frontend scaffold | ✅ Done | Real API client + BFF proxy |
| `apps/api` (NestJS) | ✅ Done | Runs on port **3333** by default |
| `apps/web` (Next.js) | ✅ Done | Runs on port **3000**; BFF at `/api/*` |
| Games API stub | ✅ Temporary | `GamesController` returns `[]` replaced in Phase 6 with Prisma |

---

## Rules for Phase 3

### No-mock policy (application code)

| Allowed | Not allowed |
|---|---|
| Real `PrismaClient` → Neon | In-memory fake repositories in `apps/` or `libs/` |
| Real `SELECT 1` health check | Hardcoded `{ status: "ok" }` without a query |
| Seed script inserting real rows in dev/CI | Fake JSON files pretending to be the DB |
| `vi.mock(PrismaClient)` in `*.spec.ts` only | MSW or mocked DB in e2e for `/health/db` |

### Generator-first

```bash
pnpm nx g @gamestore/workspace:integration-lib --name=prisma
```

Extend generated files do not hand-scaffold `libs/api/prisma` with different conventions.

### Port & env (current conventions)

| Service | Port | Env var |
|---|---|---|
| Next.js (`web`) | 3000 | |
| NestJS (`api`) | 3333 | `PORT` (optional) |
| Neon | cloud | `DATABASE_URL`, `DIRECT_URL` |

`API_URL` in `.env` must point to Nest (**3333**), never Next (**3000**) avoids BFF proxy loops.

---

## Execution slices (review after each)

Work **one slice at a time**. After each slice: run verify commands → user reviews → continue.

---

### Slice 3.1 Neon project setup (manual, outside repo)

**Goal:** Create a Neon PostgreSQL database and connection strings.

**Steps (Neon console):**

1. Create Neon project + database
2. Copy **pooled** connection string (`?sslmode=require`)
3. Copy **direct** connection string (for migrations)
4. Create branches:
   - `main` production
   - `dev` local development
   - `ci` CI pipeline (optional)

**Add to `.env` (local only never commit):**

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

**Update `.env.example`** with placeholder keys (no real credentials).

**Verify:**

- Connection strings open in Neon SQL editor
- `sslmode=require` present on both URLs

**Exit criteria:**

- [ ] Neon `dev` branch exists
- [ ] `DATABASE_URL` + `DIRECT_URL` in local `.env`
- [ ] `.env.example` documents both vars

---

### Slice 3.2 Generate Prisma integration lib

**Goal:** Scaffold `libs/api/prisma` via the workspace generator.

```bash
pnpm nx build gamestore-plugin
pnpm nx g @gamestore/workspace:integration-lib --name=prisma
```

**Expected structure after generator + manual expansion:**

```
libs/api/prisma/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts                 # exports PrismaClient singleton
│   └── lib/
│       └── prisma.service.ts    # Nest injectable wrapping PrismaClient
├── project.json                 # prisma-generate, prisma-migrate, db-seed targets
└── ...
```

**Add Nx targets** (if not emitted by generator):

| Target | Command |
|---|---|
| `prisma-generate` | `prisma generate` |
| `prisma-migrate` | `prisma migrate dev` |
| `db-seed` | `prisma db seed` |
| `prisma-studio` | `prisma studio` (optional) |

**Wire `tsconfig.base.json` path:**

```
@gamestore/api/prisma → libs/api/prisma/src/index.ts
```

**Verify:**

```bash
pnpm nx run api-prisma:prisma-generate
```

**Exit criteria:**

- [ ] `libs/api/prisma` exists with correct tags (`scope:api`, `platform:database`)
- [ ] `prisma generate` succeeds (schema can be minimal initially)

---

### Slice 3.3 Initial Prisma schema

**Goal:** Define MVP models aligned with domain docs.

**Models:**

| Model | Purpose |
|---|---|
| `Game` | Catalog item (+ SEO fields for later) |
| `GamePricingRegion` | PPP regional price (schema only in MVP) |
| `GameAccount` | Steam account pool entry |
| `License` | Purchased / assigned license key |

**`Game` fields (minimum):**

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `title` | `String` | |
| `slug` | `String @unique` | URL segment |
| `description` | `String?` | |
| `platform` | `String` | e.g. `steam`, `epic` |
| `priceBase` | `Decimal` | Base price |
| `coverImage` | `String?` | |
| `metaTitle` | `String?` | SEO used post-plan |
| `metaDescription` | `String?` | SEO used post-plan |
| `ogImage` | `String?` | SEO used post-plan |
| `publishedAt` | `DateTime?` | null = draft |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | |

**`GamePricingRegion`:**

| Field | Type |
|---|---|
| `id` | `String @id @default(cuid())` |
| `gameId` | `String` → `Game` |
| `countryCode` | `String` (ISO-2) |
| `priceAdjusted` | `Decimal` |
| `currency` | `String @default("USD")` |
| `@@unique([gameId, countryCode])` | |

**`GameAccount`:**

| Field | Type |
|---|---|
| `id` | `String @id @default(cuid())` |
| `gameId` | `String` → `Game` |
| `platform` | `String` |
| `username` | `String` |
| `passwordEncrypted` | `String` | AES later store placeholder in seed |
| `sharedSecret` | `String` | Steam TOTP Phase 5 |
| `region` | `String @default("global")` |
| `activeUsersCount` | `Int @default(0)` |
| `isActive` | `Boolean @default(true)` |
| `lockedUntil` | `DateTime?` | |
| `lastHealthCheck` | `DateTime?` | |

**`License`:**

| Field | Type |
|---|---|
| `id` | `String @id @default(cuid())` |
| `licenseKey` | `String @unique` |
| `gameId` | `String` → `Game` |
| `accountId` | `String?` → `GameAccount` |
| `status` | `String @default("available")` | `available`, `activated`, `refunded`, `swapped` |
| `buyerEmail` | `String?` |
| `buyerCountry` | `String?` | ISO-2 |
| `activatedAt` | `DateTime?` | |
| `createdAt` | `DateTime @default(now())` | |

**Reference:** domain SQL in [mvp_structure_and_roadmap.md](./mvp_structure_and_roadmap.md) / [README.md](./README.md).

**Verify:**

```bash
pnpm nx run api-prisma:prisma-generate
```

**Exit criteria:**

- [ ] All four models in `schema.prisma`
- [ ] Relations + indexes defined
- [ ] `prisma generate` passes

---

### Slice 3.4 Migrate + seed

**Goal:** Apply schema to Neon `dev` branch and insert real test rows.

```bash
pnpm nx run api-prisma:prisma-migrate -- --name init
pnpm nx run api-prisma:db-seed
```

**Seed script (`prisma/seed.ts`) real rows, no mocks:**

| Entity | Seed data |
|---|---|
| `Game` | 2–3 games with slugs (`demo-game-1`, …), `publishedAt` set |
| `GamePricingRegion` | 1–2 rows for one game (e.g. `US`, `EG`) |
| `GameAccount` | 1 account per game (placeholder encrypted password) |
| `License` | 1–2 `available` license keys for testing |

**Do not** seed fake Stripe/Steam data only catalog + license scaffolding.

**Verify:**

```bash
pnpm nx run api-prisma:prisma-studio   # optional visual check
# Or Neon SQL editor:
# SELECT count(*) FROM "Game";
```

**Exit criteria:**

- [ ] Migration `init` applied on Neon `dev`
- [ ] Seed runs without errors
- [ ] Games visible in DB (Studio or SQL)

---

### Slice 3.5 NestJS Prisma module wiring

**Goal:** Inject `PrismaService` into `apps/api` singleton, graceful shutdown.

**Files:**

| File | Action |
|---|---|
| `libs/api/prisma/src/lib/prisma.service.ts` | `extends PrismaClient`, `OnModuleInit` → `$connect()` |
| `libs/api/prisma/src/lib/prisma.module.ts` | `@Global()` Nest module exporting `PrismaService` |
| `apps/api/src/app/app.module.ts` | Import `PrismaModule` |

**Pattern:**

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Keep `GamesController` stub for now** Phase 6 replaces it with real Prisma queries. Phase 3 only proves DB connectivity.

**Verify:**

```bash
pnpm nx dev api
# No Prisma connection errors in logs
```

**Exit criteria:**

- [ ] API boots with Prisma connected to Neon
- [ ] No connection errors on startup/shutdown

---

### Slice 3.6 Database health endpoint

**Goal:** Real HTTP health check against Neon.

**Endpoint:**

```
GET /api/health/db
```

**Response (success):**

```json
{ "status": "ok", "latencyMs": 12 }
```

**Implementation:**

```typescript
const start = Date.now();
await prisma.$queryRaw`SELECT 1`;
return { status: 'ok', latencyMs: Date.now() - start };
```

**On failure:** return `503` with `{ status: "error", message: "..." }` real error, not fake OK.

**Generate via:**

```bash
pnpm nx g @gamestore/workspace:api-module --name=health
```

Or add `HealthController` manually under `apps/api/src/app/health/`.

**Verify:**

```bash
curl http://localhost:3333/api/health/db
```

**Exit criteria:**

- [ ] `/api/health/db` returns `ok` with real `latencyMs`
- [ ] Returns `503` when `DATABASE_URL` is invalid (test locally)

---

### Slice 3.7 Tests

**Goal:** Prove DB connectivity in tests mocks only in unit specs.

| Test | Type | Location | Asserts |
|---|---|---|---|
| Prisma connects | integration | `libs/api/prisma` | `$queryRaw SELECT 1` against Neon dev |
| Health endpoint | api e2e | `apps/api-e2e` (create if missing) | `GET /health/db` → 200 + `status: ok` |
| PrismaService unit | unit | `prisma.service.spec.ts` | Mock `PrismaClient` in spec only |

**Integration test notes:**

- Use Neon `dev` or `ci` branch never prod `main`
- Skip integration tests in CI if `DATABASE_URL` unset (with clear message)

**Verify:**

```bash
pnpm nx test api-prisma
pnpm nx e2e api-e2e   # when project exists
```

**Exit criteria:**

- [ ] Integration test connects to real Neon (or skips gracefully)
- [ ] Health e2e passes against running `api`
- [ ] Unit tests mock Prisma only inside `*.spec.ts`

---

## Target file tree after Phase 3

```
libs/api/prisma/
├── prisma/
│   ├── schema.prisma          # Game, GamePricingRegion, GameAccount, License
│   ├── seed.ts
│   └── migrations/
│       └── ..._init/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── prisma.service.ts
│       └── prisma.module.ts
apps/api/src/app/
├── health/
│   └── health.controller.ts   # GET /health/db
├── games/
│   └── games.controller.ts    # still stub until Phase 6
└── app.module.ts              # imports PrismaModule
.env.example                   # DATABASE_URL, DIRECT_URL documented
```

---

## Commands cheat sheet

```bash
# Generate
pnpm nx g @gamestore/workspace:integration-lib --name=prisma

# Prisma
pnpm nx run api-prisma:prisma-generate
pnpm nx run api-prisma:prisma-migrate -- --name init
pnpm nx run api-prisma:db-seed
pnpm nx run api-prisma:prisma-studio

# Run
pnpm nx dev api          # :3333
pnpm nx dev web          # :3000

# Verify
curl http://localhost:3333/api/health/db
pnpm nx test api-prisma
```

---

## Phase 3 exit criteria (full checklist)

- [ ] **3.1** Neon `dev` branch + env vars in `.env`
- [ ] **3.2** `libs/api/prisma` generated with Nx targets
- [ ] **3.3** Schema: `Game`, `GamePricingRegion`, `GameAccount`, `License`
- [ ] **3.4** Migration applied + seed inserts real rows
- [ ] **3.5** `PrismaModule` wired in Nest API
- [ ] **3.6** `GET /api/health/db` returns real latency from `SELECT 1`
- [ ] **3.7** Integration + health tests pass
- [ ] No fake DB layer in application code
- [ ] Storefront still shows empty catalog until **Phase 6** (stub `GamesController` OK for now)

---

## What comes next

| Phase | Focus |
|---|---|
| **4** | Stripe setup only (env, module, setup-text routes) |
| **5** | Steam setup only (env, module, setup-text routes) |
| **6** | Real CRUD repositories + wire `feature-catalog` / `feature-game-detail` to Prisma data |

**Phase 6 preview:** Replace `GamesController` stub with `GamesRepository` using `PrismaService`. Frontend `getGames()` will return seeded rows instead of `[]`.

---

## Document map

| File | Role |
|---|---|
| [implementation_plan.md](./implementation_plan.md) | Full monorepo blueprint (Phases 0–6) |
| [PHASE_2_PLAN.md](./PHASE_2_PLAN.md) | Frontend scaffold (✅ done) |
| **PHASE_3_PLAN.md** | **This file** Prisma + Neon slice-by-slice |
| [mvp_structure_and_roadmap.md](./mvp_structure_and_roadmap.md) | Product MVP priorities |

---

## Known issues to avoid (from Phase 2)

| Issue | Prevention |
|---|---|
| BFF proxy loop | `API_URL` must be Nest port (3333), not Next (3000) |
| Multi-minute `/api/games` hangs | Self-proxy guard in BFF; upstream timeout |
| SSR blocking on missing API | Start `pnpm nx dev api` alongside `pnpm nx dev web` |

---

*Start with **Slice 3.1** (Neon console setup). Review after each slice before continuing.*
