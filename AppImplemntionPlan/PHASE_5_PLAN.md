# Phase 5 — Steam Integration Plan (Setup Only)

This document is the **detailed execution plan for Phase 5** of GameStore. It expands [implementation_plan.md](./implementation_plan.md) into reviewable slices.

**Parent plan:** [implementation_plan.md](./implementation_plan.md)  
**Previous phase:** Phase 4 — Stripe setup (✅ complete)

---

## Phase 5 goal

Install **`steam-totp`** as a dependency, document env vars, scaffold the **Steam integration lib**, add **setup-text API routes**, and wire **`feature-my-games`** so the Guard button displays the API response — **no TOTP generation, no password encryption, no account logic yet**.

**Not in Phase 5:** real `generateAuthCode()`, decrypting `GameAccount.passwordEncrypted`, license-to-account assignment, cooldown enforcement, queues, or full activation portal business rules (later phases).

---

## Prerequisites (must be complete)

| Phase / item | Status | Notes |
|---|---|---|
| Phase 0 — Nx + `@gamestore/workspace` | ✅ Done | `integration-lib` generator exists |
| Phase 1 — Theme + UI | ✅ Done | |
| Phase 2 — Frontend scaffold | ✅ Done | `/my-games` + `SteamGuardPanel` shell |
| Phase 3 — Prisma + Neon | ✅ Done | `GameAccount` model with `sharedSecret`, `passwordEncrypted` |
| Phase 4 — Stripe setup | ✅ Done | Pattern to mirror: lib → routes → data-access → UI → e2e |
| `apps/api` (NestJS) | ✅ Done | Port **3333**; BFF at Next `/api/*` |
| `apps/web` (Next.js) | ✅ Done | Port **3000** (dev) / **4200** (e2e start) |
| `apps/api-e2e` | ✅ Done | Vitest + supertest against `AppModule` |
| `apps/web-e2e` | ✅ Done | Playwright; checkout spec pattern for Steam |

---

## Schema context (Phase 3 — for future implementation)

`GameAccount` in `libs/api/prisma/prisma/schema.prisma` already has fields Phase 5+ will use:

| Field | Future use |
|---|---|
| `passwordEncrypted` | Encrypted Steam login (needs `STEAM_ENCRYPTION_KEY`) |
| `sharedSecret` | Input to `steam-totp` `generateAuthCode()` |
| `lockedUntil` | Cooldown after guard code request |
| `activeUsersCount` | Concurrent activation limits |

**Phase 5 does not read or write these fields** — setup text only.

---

## Rules for Phase 5

### No-mock policy (application code)

| Allowed | Not allowed |
|---|---|
| Setup JSON from real Nest routes | Hardcoded TOTP codes in UI or API |
| `SteamConfig` reading + validating env format | Calling `generateAuthCode()` in services |
| `requestSteamGuardCode()` → real `POST /api/steam/guard-code` | Fake 6-digit codes in components |
| `vi.mock('steam-totp')` in `*.spec.ts` only | MSW returning fake TOTP in e2e (route stub for UI ok; api e2e must hit real Nest) |

### Generator-first

```bash
pnpm nx g @gamestore/workspace:integration-lib --name=steam
```

Extend generated files — match conventions from `libs/api/stripe` (Phase 4).

### Port & env (current conventions)

| Service | Port | Env var |
|---|---|---|
| Next.js (`web`) | 3000 (dev) | — |
| NestJS (`api`) | 3333 | `PORT` (optional) |
| Neon | cloud | `DATABASE_URL`, `DIRECT_URL` |

`API_URL` must point to Nest (**3333**), never Next (**3000**).

### Phase 4 patterns to reuse

| Phase 4 (Stripe) | Phase 5 (Steam) |
|---|---|
| `libs/api/stripe/` | `libs/api/steam/` |
| `StripeModule` + `PaymentsController` | `SteamModule` + `SteamController` in `apps/api` |
| `libs/web/data-access/.../payments.api.ts` | `steam.api.ts` (or extend `licenses.api.ts`) |
| `checkout-payment.tsx` (`'use client'`) | `steam-guard-panel.tsx` (`'use client'`) |
| `payments.e2e-spec.ts` | `steam.e2e-spec.ts` |
| `checkout.spec.ts` (Playwright) | `my-games.spec.ts` or `steam-guard.spec.ts` |

---

## Current state (before Phase 5)

| Item | Status |
|---|---|
| `.env.example` Steam keys | Present (minimal comments) |
| `libs/api/steam/` | **Not created** |
| `POST /api/steam/guard-code` | **Not routed** |
| `GET /api/steam/health` | **Not routed** |
| `SteamGuardPanel` | Static hardcoded setup message |
| `requestSteamGuardCode()` in `licenses.api.ts` | Exists — calls `/steam/guard-code` (will 404 until 5.3) |

---

## Execution slices (review after each)

Work **one slice at a time**. After each slice: run verify commands → user reviews → say **move next** before continuing.

---

### Slice 5.1 — Steam library (shell)

**Goal:** Scaffold `libs/api/steam` with config + setup-text services. Install `steam-totp` but do not call it.

**Generate:**

```bash
pnpm nx build gamestore-plugin
pnpm nx g @gamestore/workspace:integration-lib --name=steam
```

**Target structure:**

```
libs/api/steam/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── steam.config.ts           # reads env; validates format only
│       ├── steam-guard.service.ts    # setup text — TODO(implement-steam)
│       ├── steam-account.service.ts  # setup text — TODO(implement-steam)
│       └── steam.module.ts           # exports services (no routes yet)
```

**`steam.config.ts` responsibilities:**

- Read `STEAM_ENCRYPTION_KEY`, `STEAM_GUARD_COOLDOWN_MINUTES`
- `getSetupResponse(action)` → `{ status: 'setup', integration: 'steam', message: '...' }`
- `getEnvStatus()` — e.g. encryption key present / valid length (no crypto ops)
- `getHealthResponse()` — `"Steam — configured, not implemented yet"` when key present

**`steam-guard.service.ts`:**

```typescript
requestGuardCode() {
  return SteamConfig.getSetupResponse('guard-code');
  // TODO(implement-steam): generateAuthCode(sharedSecret)
}
```

**`steam-account.service.ts`:**

```typescript
health() {
  return SteamConfig.getHealthResponse();
}
// TODO(implement-steam): decrypt account passwords
```

**Dependency:**

```bash
pnpm add -w steam-totp
```

Do **not** import or call `generateAuthCode()` in application code.

**Verify:**

```bash
pnpm nx build api-steam
pnpm nx test api-steam
```

**Exit criteria:**

- [ ] `libs/api/steam` exists with config + both services
- [ ] `steam-totp` in `package.json`
- [ ] No `generateAuthCode()` calls
- [ ] Unit tests for config format validation + setup responses

---

### Slice 5.2 — Environment variables

**Goal:** Document Steam env vars in `.env.example` with format notes.

**Vars (optional until implementation):**

```env
# Steam (setup only — Phase 5; optional until Guard is implemented)
# STEAM_ENCRYPTION_KEY        = 32-byte hex or base64 secret (server only — NestJS)
# STEAM_GUARD_COOLDOWN_MINUTES = minutes between guard code requests per account (default 15)
STEAM_ENCRYPTION_KEY=
STEAM_GUARD_COOLDOWN_MINUTES=15
```

**Update `libs/api/steam/README.md`** with env table (mirror `libs/api/stripe/README.md`).

**Verify:**

```bash
pnpm nx test api-steam   # env read/status tests via vi.stubEnv
```

**Exit criteria:**

- [ ] `.env.example` documents both vars with comments
- [ ] `SteamConfig.readEnv()` / `getEnvStatus()` tested
- [ ] Values optional until real implementation

---

### Slice 5.3 — API routes (setup text only)

**Goal:** Expose Steam setup endpoints from Nest.

| Method | Route | Response |
|---|---|---|
| POST | `/api/steam/guard-code` | `{ status: "setup", integration: "steam", message: "Steam Guard — not implemented yet" }` |
| GET | `/api/steam/health` | `{ status: "setup", integration: "steam", message: "Steam — configured, not implemented yet" }` |

**Implementation:**

```
apps/api/src/app/steam/
└── steam.controller.ts    # GET health, POST guard-code → SteamGuardService / SteamAccountService
```

Wire in `app.module.ts`:

```typescript
imports: [PrismaModule, StripeModule, SteamModule],
controllers: [..., SteamController],
```

**Note:** `POST /api/steam/guard-code` may accept `{ licenseKey }` in body (for Phase 6) but **ignores it** in Phase 5 — always returns setup JSON.

**Verify:**

```bash
pnpm nx build api
curl http://localhost:3333/api/steam/health
curl -X POST http://localhost:3333/api/steam/guard-code -H "Content-Type: application/json" -d "{}"
```

**Exit criteria:**

- [ ] Both routes return setup JSON
- [ ] No `steam-totp` usage in controllers or services
- [ ] Routes registered under global prefix `api`

---

### Slice 5.4 — Frontend wiring (display setup text)

**Goal:** `SteamGuardPanel` button calls the API and shows the returned message.

**In `libs/web/data-access`:**

Add or consolidate `steam.api.ts`:

```typescript
export async function requestSteamGuardCode(
  licenseKey?: string,
): Promise<SetupResponse> {
  return apiPost<SetupResponse>('/steam/guard-code', { licenseKey });
}
```

(Re-export from `index.ts`; remove duplicate from `licenses.api.ts` if consolidating.)

**In `libs/web/feature-my-games`:**

Refactor `steam-guard-panel.tsx` to `'use client'`:

- Button: **Request Steam Guard code** (or similar)
- On click → `requestSteamGuardCode()`
- Render `response.message` in `.setupMessage` panel
- **No** 6-digit TOTP display

Optional: pass license key from `LicenseKeyForm` state later — Phase 5 may send empty `{}` or a placeholder string.

**Verify:**

```bash
pnpm nx dev api    # :3333
pnpm nx dev web    # :3000
# /my-games → click guard button → see API setup message
```

**Exit criteria:**

- [ ] Button triggers `POST /api/steam/guard-code` via BFF
- [ ] Setup message visible on page (from API, not hardcoded)
- [ ] No TOTP digits shown

---

### Slice 5.5 — Tests

**Goal:** Prove routes and UI wiring — mocks only in unit specs.

| Test | Type | Location | Asserts |
|---|---|---|---|
| Steam config / services | unit | `libs/api/steam` | Setup responses; no `steam-totp` calls |
| Steam routes | api e2e | `apps/api-e2e/src/steam.e2e-spec.ts` | `GET /steam/health`, `POST /steam/guard-code` → setup JSON |
| My Games UI | web e2e | `apps/web-e2e/src/steam-guard.spec.ts` | Click guard → setup message visible |

**API e2e notes:**

- Uses full `AppModule` (same as `health-db.e2e-spec.ts`)
- Skip when `DATABASE_URL` unset if Prisma boot requires it
- Expect `201` on POST if Nest default (match Phase 4 payments tests)

**Web e2e notes:**

- May stub `POST /api/steam/guard-code` in Playwright (API covered by api-e2e)
- Run `pnpm nx build web` with `NODE_ENV=production` before e2e if using `nx start`
- Optional: `E2E_SKIP_WEBSERVER=1` + `BASE_URL` for manual server

**Verify:**

```bash
pnpm nx test api-steam
pnpm nx e2e api-e2e
pnpm exec playwright test --config=apps/web-e2e/playwright.config.mts apps/web-e2e/src/steam-guard.spec.ts
```

**Exit criteria:**

- [ ] `api-steam` unit tests pass
- [ ] API e2e covers both Steam routes
- [ ] Web e2e covers guard button → setup message
- [ ] No `steam-totp` calls outside `*.spec.ts` mocks

---

## Target file tree after Phase 5

```
libs/api/steam/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── steam.config.ts
│       ├── steam.config.spec.ts
│       ├── steam-guard.service.ts
│       ├── steam-guard.service.spec.ts
│       ├── steam-account.service.ts
│       ├── steam.module.ts
│       └── ...
apps/api/src/app/
├── steam/
│   └── steam.controller.ts      # GET /steam/health, POST /steam/guard-code
├── payments/                    # Phase 4 — unchanged
└── app.module.ts                # imports SteamModule
libs/web/data-access/src/lib/
└── steam.api.ts                 # requestSteamGuardCode()
libs/web/feature-my-games/src/lib/components/
└── steam-guard-panel.tsx        # 'use client' — button + API message
.env.example                     # STEAM_* documented
```

---

## Commands cheat sheet

```bash
# Generate
pnpm nx g @gamestore/workspace:integration-lib --name=steam

# Build & test
pnpm nx build api-steam
pnpm nx test api-steam
pnpm nx build api
pnpm nx e2e api-e2e

# Run locally
pnpm nx dev api          # :3333
pnpm nx dev web          # :3000

# Verify routes
curl http://localhost:3333/api/steam/health
curl -X POST http://localhost:3333/api/steam/guard-code \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"DEMO-KEY-0001"}'

# Web e2e (after production build if using start)
$env:NODE_ENV='production'; pnpm nx build web
pnpm exec playwright test --config=apps/web-e2e/playwright.config.mts
```

---

## Phase 5 exit criteria (full checklist)

- [ ] **5.1** `libs/api/steam` shell + `steam-totp` installed (unused)
- [ ] **5.2** `STEAM_ENCRYPTION_KEY` + `STEAM_GUARD_COOLDOWN_MINUTES` documented
- [ ] **5.3** `GET /api/steam/health` + `POST /api/steam/guard-code` return setup JSON
- [ ] **5.4** `/my-games` guard button shows API setup message
- [ ] **5.5** Unit + api e2e + web e2e pass
- [ ] No `generateAuthCode()`, no password decryption, no fake TOTP in app code

---

## What comes next

| Phase | Focus |
|---|---|
| **6** | Real Prisma CRUD + wire catalog/game-detail to seeded data; licenses validate against DB |
| **Later** | Real Steam Guard (TOTP), encryption, cooldowns, account assignment |

**Phase 6 preview:** `GamesController` stub → `GamesRepository`; `POST /licenses/validate` checks real `License` rows; Steam/Stripe routes **still setup-only** until dedicated implementation phases.

---

## Document map

| File | Role |
|---|---|
| [implementation_plan.md](./implementation_plan.md) | Full monorepo blueprint (Phases 0–6) |
| [PHASE_2_PLAN.md](./PHASE_2_PLAN.md) | Frontend scaffold (✅ done) |
| [PHASE_3_PLAN.md](./PHASE_3_PLAN.md) | Prisma + Neon (✅ done) |
| **PHASE_5_PLAN.md** | **This file** — Steam setup slice-by-slice |
| [mvp_structure_and_roadmap.md](./mvp_structure_and_roadmap.md) | Product MVP priorities |

---

## Known issues to avoid (from Phases 3–4)

| Issue | Prevention |
|---|---|
| BFF proxy loop | `API_URL=http://localhost:3333` |
| `prisma generate` EPERM on Windows | Stop `nx serve api` before generate, or skip `dependsOn` for e2e |
| Web e2e stale production build | `NODE_ENV=production pnpm nx build web` before `nx start` |
| Next dev lock on `.next/dev/lock` | Use `nx start` for e2e or single dev instance |
| API e2e without Neon | Skip gracefully when `DATABASE_URL` unset |

---

*Start with **Slice 5.1** (generate `integration-lib --name=steam`). Review after each slice before continuing.*
