# Phase 6 Backend CRUD + Frontend Connection + E2E

This document is the **detailed execution plan for Phase 6** of GameStore. It expands [implementation_plan.md](./implementation_plan.md) into reviewable slices.

**Parent plan:** [implementation_plan.md](./implementation_plan.md)  
**Previous phase:** Phase 5 Steam setup (✅ complete)

---

## Phase 6 goal

Replace API stubs with **real Prisma CRUD** against Neon, wire the storefront to return **real DB data** for games and license validation, and add full-stack e2e coverage. **Stripe, Steam, SEO, and orders remain setup-only** no payment capture, no TOTP, no `generateMetadata`.

**Not in Phase 6:** Stripe webhook license creation, real Steam Guard codes, account assignment / cooldowns, PPP pricing logic, IGDB sync, admin UI, `Order` model, dynamic SEO.

---

## Prerequisites (must be complete)

| Phase / item | Status | Notes |
|---|---|---|
| Phase 0 Nx + `@gamestore/workspace` | ✅ Done | `api-resource`, `api-module`, `e2e-spec` generators |
| Phase 1 Theme + UI | ✅ Done | `EmptyState`, `Card`, `Button`, etc. |
| Phase 2 Frontend scaffold | ✅ Done | BFF proxy, `apiGet` / `apiPost`, feature pages |
| Phase 3 Prisma + Neon | ✅ Done | Schema, seed, `PrismaModule`, `GET /api/health/db` |
| Phase 4 Stripe setup | ✅ Done | Setup-text payment routes |
| Phase 5 Steam setup | ✅ Done | Setup-text guard routes |
| `apps/api` (NestJS) | ✅ Done | Global prefix `api`, port **3333** |
| `apps/web` (Next.js) | ✅ Done | Port **3000** (dev) / **4200** (e2e start) |
| Seed data | ✅ Done | 3 games, 2 licenses (`DEMO-KEY-0001`, `DEMO-KEY-0002`) |

---

## Schema context (Phase 3 used in Phase 6)

| Model | Phase 6 usage |
|---|---|
| `Game` | List + get by slug; public catalog Filters `publishedAt IS NOT NULL` |
| `GamePricingRegion` | **Not exposed** in Phase 6 (PPP later) |
| `GameAccount` | Admin CRUD via API only no password decryption |
| `License` | `POST /licenses/validate` looks up `licenseKey`; admin list/create/revoke |

**Seed keys for manual / e2e testing:**

| Key | Game slug | Status |
|---|---|---|
| `DEMO-KEY-0001` | `demo-game-1` | `available` |
| `DEMO-KEY-0002` | `demo-game-2` | `available` |

---

## Rules for Phase 6

### No-mock policy (application code)

| Allowed | Not allowed |
|---|---|
| Real Prisma queries via `PrismaService` | Hardcoded game arrays in controllers |
| Real `404` when slug/key not found | Fake license objects in UI |
| `vi.mock('@prisma/client')` in `*.spec.ts` only | MSW / Playwright route stubs for CRUD e2e |
| Stripe/Steam routes still return setup JSON | Creating licenses from Stripe webhook |
| Empty catalog when DB has no published games | Seeding games only in frontend code |

### Controller placement (match Phases 4–5)

| Layer | Location | Pattern |
|---|---|---|
| Repositories + domain services | `libs/api/data-access/` | Inject `PrismaService` |
| HTTP controllers | `apps/api/src/app/*/` | Thin delegate to lib services |
| Integration setup text | `libs/api/stripe`, `libs/api/steam` | Unchanged |

**Generator note:** `api-resource` templates use `@Controller('api/<resource>')` which **double-prefixes** with Nest's global `api` prefix. Use `@Controller('games')` not `@Controller('api/games')`. Fix templates or hand-edit after generate.

### Port & env

| Service | Port | Env var |
|---|---|---|
| Next.js (`web`) | 3000 (dev) | `API_URL=http://localhost:3333` |
| NestJS (`api`) | 3333 | `DATABASE_URL`, `DIRECT_URL` |
| Neon | cloud | Same as Phase 3 |

`API_URL` must point to Nest (**3333**), never Next (**3000**).

### Decimal serialization

Prisma `Decimal` fields (`priceBase`) serialize as strings in JSON. Map to `number` or `string` in DTOs consistently; document the choice in `games.api.ts` types.

---

## Current state (before Phase 6)

| Item | Status |
|---|---|
| `apps/api/.../games.controller.ts` | Stub `GET /games` → `[]`, `GET /games/:slug` → `404` |
| `libs/api/data-access/` | **Not created** |
| `POST /api/licenses/validate` | **Not routed** |
| `GET/POST /api/game-accounts` | **Not routed** |
| `GET /api/orders` | **Not routed** (no `Order` model in schema) |
| `libs/web/data-access/games.api.ts` | Calls real API gets empty `[]` today |
| `libs/web/data-access/licenses.api.ts` | `validateLicense()` typed as `SetupResponse` wrong for Phase 6 |
| `feature-catalog` `CatalogGrid` | Already calls `getGames()` shows empty state |
| `feature-game-detail` | Already calls `getGameBySlug()` shows 404 empty state |
| `feature-my-games` `LicenseKeyForm` | Static `readOnly` input not wired |
| Stripe / Steam routes | Setup text **keep as-is** |
| SEO | File shell from Phase 2 **no changes** |

---

## Target API surface

### Games (real CRUD)

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/games` | Published games, ordered by `title` |
| GET | `/api/games/:slug` | Single game by slug or `404` |
| POST | `/api/games` | Create (admin / e2e) validate unique slug |
| PUT | `/api/games/:id` | Update by id |
| DELETE | `/api/games/:id` | Delete by id (cascade per schema) |

**Public list DTO** (minimum fields for storefront):

```typescript
{
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  platform: string;
  priceBase: string; // Decimal as string
  coverImage?: string | null;
}
```

### Licenses (real validate + admin CRUD)

| Method | Route | Behavior |
|---|---|---|
| POST | `/api/licenses/validate` | Body `{ licenseKey }` → license + game summary or `404` |
| GET | `/api/licenses` | List (admin / e2e) |
| GET | `/api/licenses/:id` | Get by id |
| POST | `/api/licenses` | Create |
| POST | `/api/licenses/:id/revoke` | Set `status: 'revoked'` |

**Validate response** (success `200`):

```typescript
{
  licenseKey: string;
  status: string;
  game: { id: string; title: string; slug: string };
}
```

### Game accounts (API only no storefront UI)

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/game-accounts` | List (optional `?gameId=`) |
| GET | `/api/game-accounts/:id` | Get by id |
| POST | `/api/game-accounts` | Create |
| POST | `/api/game-accounts/:id/deactivate` | Set `isActive: false` |

Do **not** return `passwordEncrypted` or `sharedSecret` in public responses.

### Orders (setup only deferred)

No `Order` model exists yet. Add a minimal setup controller:

| Method | Route | Response |
|---|---|---|
| GET | `/api/orders` | `{ status: 'setup', integration: 'orders', message: '...' }` |
| GET | `/api/orders/:id` | Same setup JSON |

### Unchanged (setup text)

| Route | Phase |
|---|---|
| `POST /api/payments/checkout` | Phase 4 |
| `POST /api/steam/guard-code` | Phase 5 |

---

## Execution slices (review after each)

Work **one slice at a time**. After each slice: run verify commands → user reviews → say **continue** before continuing.

---

### Slice 6.1 Data-access library shell

**Goal:** Create `libs/api/data-access` with repository pattern wired to `PrismaService`.

**Generate:**

```bash
pnpm nx build gamestore-plugin
pnpm nx g @gamestore/workspace:api-module --name=data-access
```

**Target structure:**

```
libs/api/data-access/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── data-access.module.ts    # imports PrismaModule, exports repositories
│       ├── games.repository.ts
│       ├── licenses.repository.ts
│       └── game-accounts.repository.ts
```

**`GamesRepository` methods (implement with real Prisma):**

- `findPublished()` `where: { publishedAt: { not: null } }`, `orderBy: { title: 'asc' }`
- `findBySlug(slug)` `findUnique({ where: { slug } })`
- `findById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`

**Wire in `apps/api/src/app/app.module.ts`:**

```typescript
imports: [PrismaModule, DataAccessModule, StripeModule, SteamModule],
```

**Add `api-data-access:build` to `apps/api/project.json` `dependsOn`.**

**Unit tests** (`games.repository.spec.ts`):

- Mock `PrismaService` with `vi.fn()` assert correct `findMany` / `findUnique` calls
- No real DB in unit tests

**Verify:**

```bash
pnpm nx build api-data-access
pnpm nx test api-data-access
```

**Exit criteria:**

- [ ] `libs/api/data-access` exists and exports `DataAccessModule`
- [ ] `GamesRepository` has real Prisma method signatures (can stub licenses/accounts as `throw new Error('TODO')` until 6.3/6.4)
- [ ] Unit tests mock Prisma only

---

### Slice 6.2 Games API (replace stub)

**Goal:** Replace `GamesController` stub with real Prisma-backed handlers.

**Files:**

```
apps/api/src/app/games/
├── games.controller.ts    # replace stub
└── games.service.ts       # thin wrapper over GamesRepository
```

Or move service into `libs/api/data-access` and keep controller thin in `apps/api` (preferred matches Stripe lib pattern).

**Behavior:**

- `GET /api/games` → seeded games when `pnpm prisma db seed` has run
- `GET /api/games/demo-game-1` → `Stellar Odyssey`
- `GET /api/games/nonexistent` → `404`

**DTO mapping:** Strip internal fields if needed; map `Decimal` → string for JSON.

**Verify:**

```bash
pnpm nx build api
pnpm nx serve api
curl http://localhost:3333/api/games
curl http://localhost:3333/api/games/demo-game-1
curl -i http://localhost:3333/api/games/bad-slug   # expect 404
```

**Exit criteria:**

- [ ] Stub `return []` removed
- [ ] List returns seed games when DB is seeded
- [ ] Slug lookup returns real entity or `404`
- [ ] `pnpm nx build api` succeeds

---

### Slice 6.3 Licenses API (validate + CRUD)

**Goal:** Implement license repository and `POST /api/licenses/validate`.

**Files:**

```
apps/api/src/app/licenses/
├── licenses.controller.ts
└── licenses.service.ts
```

**`LicensesRepository`:**

- `findByKey(licenseKey)` include `game: { select: { id, title, slug } }`
- `findAll()`, `findById(id)`, `create(dto)`, `revoke(id)`

**`POST /api/licenses/validate`:**

- Body: `{ licenseKey: string }` (required, non-empty → else `400`)
- Found → `200` with license + game summary
- Not found → `404`
- Revoked license → `400` or `403` with clear message (pick one, document in tests)

**Register** `LicensesController` in `app.module.ts`.

**Verify:**

```bash
curl -X POST http://localhost:3333/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"DEMO-KEY-0001"}'

curl -X POST http://localhost:3333/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"INVALID"}'   # expect 404
```

**Exit criteria:**

- [ ] Validate returns real seeded license + game
- [ ] Invalid key returns `404`
- [ ] Repository unit tests mock Prisma
- [ ] No setup-text response on validate route

---

### Slice 6.4 Game accounts API (admin CRUD)

**Goal:** Expose game-account management for ops / e2e **no frontend page** in Phase 6.

**Files:**

```
apps/api/src/app/game-accounts/
├── game-accounts.controller.ts
└── game-accounts.service.ts
```

**Responses must omit** `passwordEncrypted` and `sharedSecret` (use Prisma `select`).

**`POST /api/game-accounts/:id/deactivate`** sets `isActive: false`.

**Verify:**

```bash
curl http://localhost:3333/api/game-accounts
curl -X POST http://localhost:3333/api/game-accounts/<id>/deactivate
```

**Exit criteria:**

- [ ] List returns seed accounts without secrets
- [ ] Deactivate updates `isActive`
- [ ] Unit tests for repository

---

### Slice 6.5 Orders setup routes (optional thin slice)

**Goal:** Satisfy implementation_plan orders mention without an `Order` model.

**Files:**

```
apps/api/src/app/orders/
└── orders.controller.ts    # GET list + GET :id → setup JSON
```

**Response:**

```json
{
  "status": "setup",
  "integration": "orders",
  "message": "Orders not implemented yet"
}
```

**Skip this slice** if you prefer to defer until an `Order` model is added not blocking storefront.

**Exit criteria:**

- [ ] Routes return setup JSON (if implemented)
- [ ] No Prisma calls for orders

---

### Slice 6.6 Frontend: catalog + game detail (real data)

**Goal:** Storefront displays seeded games without code changes beyond types.

**`libs/web/data-access/src/lib/games.api.ts`:**

- Expand `Game` type to match API DTO (`description`, `platform`, `priceBase`, `coverImage`)
- `getGames()` / `getGameBySlug()` unchanged already call real API

**`feature-catalog`:**

- `CatalogGrid` already maps games verify cards show **Stellar Odyssey**, etc.
- Optional: link `CatalogCard` to `/games/${game.slug}`

**`feature-game-detail`:**

- Show `description`, `platform`, `priceBase` from API entity
- `/games/demo-game-1` shows real title (update `pages.spec.ts` if e2e expects "Game not found" for all slugs)

**Verify:**

```bash
pnpm nx dev api    # :3333 requires DATABASE_URL + seed
pnpm nx dev web    # :3000
# /shop → 3 game cards
# /games/demo-game-1 → Stellar Odyssey
```

**Exit criteria:**

- [ ] `/shop` shows seeded games (not empty state)
- [ ] `/games/demo-game-1` shows real title
- [ ] `/games/bad-slug` still shows empty / not-found UI
- [ ] Unit test: `CatalogGrid` with mocked `getGames` returning one game renders title

---

### Slice 6.7 Frontend: license validation

**Goal:** Wire `LicenseKeyForm` to `POST /api/licenses/validate`.

**`libs/web/data-access/src/lib/licenses.api.ts`:**

```typescript
export type LicenseValidation = {
  licenseKey: string;
  status: string;
  game: { id: string; title: string; slug: string };
};

export async function validateLicense(
  licenseKey: string,
): Promise<LicenseValidation> {
  return apiPost<LicenseValidation>('/licenses/validate', { licenseKey });
}
```

**`license-key-form.tsx`** → `'use client'`:

- Controlled input (remove `readOnly`)
- Validate button → `validateLicense(key)`
- Success: show game title + status
- Error: show `ApiError` message (404 → "License not found")

**Optional:** Pass validated `licenseKey` into `SteamGuardPanel` / `requestSteamGuardCode(licenseKey)` Steam still returns setup text.

**Verify:**

```bash
# /my-games → enter DEMO-KEY-0001 → see Stellar Odyssey
# enter INVALID → see error
```

**Exit criteria:**

- [ ] Form calls real API (not setup text)
- [ ] Valid seed key shows game title
- [ ] Invalid key shows error state
- [ ] Steam guard button still shows setup message (unchanged)

---

### Slice 6.8 API e2e tests

**Goal:** CRUD + validate specs against real Neon (skip when `DATABASE_URL` unset).

**New specs:**

```
apps/api-e2e/src/
├── games.e2e-spec.ts       # list includes seed; slug lookup; create → get → delete
├── licenses.e2e-spec.ts    # validate DEMO-KEY-0001; invalid → 404
└── game-accounts.e2e-spec.ts  # list omits secrets; deactivate
```

**Pattern** (same as `health-db.e2e-spec.ts`):

```typescript
describe.skipIf(!hasDatabase)('Games API', () => { ... });
```

**Games CRUD test flow:**

1. `POST /api/games` with unique slug `e2e-test-${Date.now()}`
2. `GET /api/games/:slug` returns created title
3. `DELETE /api/games/:id` then `GET` → `404`

Use unique slugs to avoid clashing with seed data; clean up in `afterAll` if delete fails.

**Existing specs** (`payments`, `steam`, `health-db`) must still pass setup text unchanged.

**Verify:**

```bash
pnpm nx e2e api-e2e
```

**Exit criteria:**

- [ ] Games + licenses e2e pass with `DATABASE_URL`
- [ ] Graceful skip without DB
- [ ] Payment + steam e2e still assert setup JSON

---

### Slice 6.9 Web e2e tests

**Goal:** Full-stack assertions for catalog + license flow.

**New / updated specs:**

```
apps/web-e2e/src/
├── catalog.spec.ts          # /shop shows "Stellar Odyssey" (requires API + DB)
├── license-validate.spec.ts   # my-games validate DEMO-KEY-0001
└── pages.spec.ts              # update /games/test-slug vs /games/demo-game-1
```

**Catalog e2e strategy:**

- Requires **real API + seeded Neon** (no Playwright route stub for games)
- Skip or `test.skip(!process.env.DATABASE_URL)` when DB unavailable locally
- Alternative for local dev without Neon: keep catalog test DB-gated only in CI

**`checkout.spec.ts` / `steam-guard.spec.ts`:** unchanged still assert setup messages.

**Verify:**

```bash
$env:NODE_ENV='production'; pnpm nx build web
pnpm nx e2e api-e2e          # API must be embedded in web e2e OR run both services
pnpm exec playwright test --config=apps/web-e2e/playwright.config.mts
```

For web e2e with real data, ensure Nest is reachable at `API_URL` from the Next server process (BFF proxy).

**Exit criteria:**

- [ ] `catalog.spec.ts` sees seeded game title when DB available
- [ ] `license-validate.spec.ts` passes with real API
- [ ] Full web suite green (target **18+** tests)
- [ ] Stripe/steam setup specs still pass

---

## Phase 6 exit criteria (full checklist)

- [ ] **6.1** `libs/api/data-access` with Prisma repositories
- [ ] **6.2** Games routes return real entities from Neon
- [ ] **6.3** `POST /api/licenses/validate` returns real license + game
- [ ] **6.4** Game accounts CRUD (API only, secrets redacted)
- [ ] **6.5** Orders setup routes (optional) or explicitly deferred
- [ ] **6.6** `/shop` and `/games/:slug` show seeded data
- [ ] **6.7** My Games license form validates against DB
- [ ] **6.8** API e2e: games + licenses CRUD/validate
- [ ] **6.9** Web e2e: catalog + license validate
- [ ] Stripe + Steam routes still setup-only
- [ ] SEO unchanged (no `generateMetadata`)
- [ ] Mocks only in `*.spec.ts`

---

## Verify commands (end of phase)

```bash
# Unit
pnpm nx test api-data-access
pnpm nx test api-prisma

# Build
pnpm nx build api
$env:NODE_ENV='production'; pnpm nx build web

# E2E (requires DATABASE_URL + seed)
pnpm nx run api-prisma:prisma-seed   # if target exists, or: npx prisma db seed
pnpm nx e2e api-e2e
pnpm exec playwright test --config=apps/web-e2e/playwright.config.mts

# Manual smoke
pnpm nx serve api    # :3333
pnpm nx dev web      # :3000
curl http://localhost:3333/api/games
curl -X POST http://localhost:3333/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"DEMO-KEY-0001"}'
```

---

## What comes next

| Phase / topic | Focus |
|---|---|
| **Stripe implementation** | Real Checkout Session, webhook → create `License` |
| **Steam implementation** | `generateAuthCode()`, encryption, cooldowns, account assignment |
| **Orders** | Add `Order` model + link to Stripe payment intent |
| **SEO** | `generateMetadata`, JSON-LD, dynamic sitemap from `Game` rows |
| **Admin** | Protected CRUD UI for games / accounts / licenses |
| **PPP pricing** | `GamePricingRegion` + geo detection |

---

## Document map

| File | Role |
|---|---|
| [implementation_plan.md](./implementation_plan.md) | Full monorepo blueprint (Phases 0–6) |
| [PHASE_3_PLAN.md](./PHASE_3_PLAN.md) | Prisma + Neon (✅ done) |
| [PHASE_5_PLAN.md](./PHASE_5_PLAN.md) | Steam setup (✅ done) |
| **PHASE_6_PLAN.md** | **This file** CRUD + storefront wiring |
| [mvp_structure_and_roadmap.md](./mvp_structure_and_roadmap.md) | Product MVP priorities |

---

## Known issues to avoid (from Phases 3–5)

| Issue | Prevention |
|---|---|
| BFF proxy loop | `API_URL=http://localhost:3333` |
| Double `api` prefix | Controllers use `@Controller('games')` not `@Controller('api/games')` |
| `prisma generate` EPERM on Windows | Stop `nx serve api` before generate |
| Web e2e stale build | `NODE_ENV=production pnpm nx build web` before `nx start` |
| Port 4200 already in use | `E2E_SKIP_WEBSERVER=1` + `BASE_URL` or `CI=true` |
| API e2e without Neon | `describe.skipIf(!hasDatabase)` |
| Decimal in JSON | Treat `priceBase` as string or `Number()` explicitly in UI |
| Exposing secrets | Never return `passwordEncrypted` / `sharedSecret` from game-accounts API |

---

*Start with **Slice 6.1** (`api-module --name=data-access` + `GamesRepository`). Review after each slice before continuing.*
