# GameStore — Nx Implementation Plan

This document is the **execution blueprint** for building GameStore as an **Nx monorepo**. It follows a **scaffold-first** approach: create structure, wiring, and tests before full business logic.

> **Design note:** Theme visuals and UI specs will be provided separately. Phase 1 only prepares the design system shell and a theme preview page.

> **Stack shift from earlier docs:** This plan uses **Nx + Next.js + Prisma + Neon PostgreSQL** (replacing the Supabase-first approach in `README.md`).

---

## What We Build Now vs Later

| Area | In this plan (now) | After this plan (later) |
|---|---|---|
| **Database / CRUD** | Real Prisma + Neon + full CRUD | Business rules (queues, PPP, …) |
| **Frontend pages** | Real routes, component trees, theme, real API data for games/licenses | Full UX polish |
| **Stripe** | **Setup only** — deps, env, module, routes return setup text | Real Checkout Sessions, webhooks, license creation |
| **Steam** | **Setup only** — deps, env, module, routes return setup text | Real TOTP, encryption, account pool logic |
| **SEO** | **Setup only** — lib shell, env vars, file placeholders, minimal root title | Full `generateMetadata`, OG, JSON-LD, dynamic sitemap |

**Setup-only response pattern** (used by Stripe, Steam, and SEO shell endpoints until implemented):

```json
{
  "status": "setup",
  "integration": "stripe",
  "message": "Stripe checkout — not implemented yet"
}
```

Frontend components for these integrations **display the setup message as visible text** — no SDK calls, no redirects, no fake payment codes.

---

## No-Mock Policy

| Rule | Application code | Test code only |
|---|---|---|
| **Database / CRUD** | Real Prisma → Neon; real entities or real HTTP errors | May mock `PrismaClient` in unit tests |
| **Stripe** | **Setup only** — config + routes return setup text (no Stripe SDK calls yet) | May mock Stripe when implementation is added |
| **Steam** | **Setup only** — config + routes return setup text (no `steam-totp` calls yet) | May mock TOTP when implementation is added |
| **SEO** | **Setup only** — file structure + env + minimal static root title (no full metadata yet) | May mock metadata builders in unit tests |
| **HTTP / API (CRUD)** | Real controllers + real Prisma for games/licenses/accounts | May mock in unit tests |
| **UI scaffold text** | Static labels in empty component shells | N/A |

**Forbidden in application code:**

- Fake data for **CRUD** routes (games, licenses, accounts must come from Neon)
- `vi.mock`, `jest.mock`, MSW in non-test files
- Calling Stripe API, generating TOTP, or full SEO metadata **before implementation phase**

**Allowed in application code:**

- **Setup-only** text/JSON responses for Stripe, Steam, and SEO routes (see pattern above)
- Static UI labels in component shells
- Real empty results from DB (`[]`, `404`)
- `TODO(implement-stripe)`, `TODO(implement-steam)`, `TODO(implement-seo)` on setup files

---

## Guiding Principles

| Principle | What it means in practice |
|---|---|
| **Generator before code** | No manual project scaffolding. Every repeatable structure is created via a local Nx plugin/generator. |
| **Scaffold structure, implement CRUD** | Phases 2 and 6 create pages + real DB CRUD; Stripe/Steam/SEO stay setup-only with visible text |
| **Mocks only in tests** | Unit tests mock dependencies. E2E hits real API + Neon for CRUD; setup routes assert visible setup text |
| **Wire DB first** | Neon + Prisma fully connected before CRUD; Stripe/Steam/SEO wired as file shells only |
| **One command consistency** | Developers run `nx g @gamestore/workspace:*` instead of remembering folder/tag conventions. |

---

## Target Monorepo Layout

```
GameStore/
├── apps/
│   ├── web/                          # Next.js storefront (App Router)
│   ├── web-e2e/                      # Playwright e2e for web
│   ├── api/                          # NestJS backend API
│   └── api-e2e/                      # API e2e tests (real HTTP, real DB)
├── libs/
│   ├── shared/
│   │   ├── theme/                    # Design tokens, CSS vars, Tailwind preset
│   │   ├── seo/                      # SEO lib shell (setup only — implement later)
│   │   ├── ui/                       # Shared UI primitives (Button, Card, …)
│   │   └── types/                    # Shared TS types / DTO shapes
│   ├── web/
│   │   ├── data-access/              # Real API client (fetch → backend)
│   │   ├── feature-home/
│   │   ├── feature-catalog/
│   │   ├── feature-game-detail/
│   │   ├── feature-checkout/
│   │   ├── feature-my-games/
│   │   ├── feature-faq/
│   │   └── feature-contact/
│   ├── api/
│   │   ├── prisma/                   # Prisma client + schema
│   │   ├── data-access/              # Real repositories (Prisma CRUD)
│   │   ├── stripe/                   # Stripe module shell (setup only — implement later)
│   │   └── steam/                    # Steam module shell (setup only — implement later)
│   └── testing/
│       └── test-utils/               # Mock factories — **test imports only**
├── tools/
│   └── gamestore-plugin/             # Local Nx plugin (generators + executors)
├── prisma/
│   └── schema.prisma
├── .env.example
├── nx.json
├── package.json
└── tsconfig.base.json
```

---

## Phase 0 — Nx Workspace & Custom Generators (DO THIS FIRST)

**Goal:** Bootstrap the monorepo and a local plugin so every later phase is repeatable and consistent.

**Exit criteria:** All generators run in dry-run and live mode; CI can run `nx run-many -t lint`.

### 0.1 Initialize Nx workspace

```bash
# From C:\Projects\GameStore
npx create-nx-workspace@latest . --preset=apps --nxCloud=skip --packageManager=pnpm
```

Recommended plugins to add immediately:

```bash
pnpm nx add @nx/next @nx/react @nx/nest @nx/playwright @nx/eslint @nx/plugin
```

### 0.2 Create local plugin: `@gamestore/workspace`

```bash
pnpm nx g @nx/plugin:plugin tools/gamestore-plugin --importPath=@gamestore/workspace
```

Register plugin name in `tools/gamestore-plugin/package.json`:

```json
{
  "name": "@gamestore/workspace",
  "generators": "./generators.json"
}
```

### 0.3 Generators to implement (in order)

Each generator wraps official Nx generators and applies GameStore conventions (paths, tags, real service wiring).

| Generator | Command | Purpose |
|---|---|---|
| `init-workspace` | `nx g @gamestore/workspace:init-workspace` | One-shot bootstrap: apps, base libs, env templates, nx tags |
| `theme-lib` | `nx g @gamestore/workspace:theme-lib` | Creates `libs/shared/theme` + preview route |
| `seo-lib` | `nx g @gamestore/workspace:seo-lib` | Creates `libs/shared/seo` shell + empty `robots.ts` / `sitemap.ts` files |
| `ui-lib` | `nx g @gamestore/workspace:ui-lib --name=button` | Creates a shared UI component lib under `libs/shared/ui/*` |
| `web-feature` | `nx g @gamestore/workspace:web-feature --name=catalog --route=/shop` | Feature lib + page shell + component tree (no `generateMetadata` yet) |
| `web-page-tree` | `nx g @gamestore/workspace:web-page-tree --page=game-detail` | Adds nested component folders |
| `api-module` | `nx g @gamestore/workspace:api-module --name=games` | Nest module + controller + service wired to real repository |
| `api-resource` | `nx g @gamestore/workspace:api-resource --resource=licenses` | Full CRUD module using Prisma repository |
| `integration-lib` | `nx g @gamestore/workspace:integration-lib --name=stripe` | Creates integration lib shell; service methods return setup text |
| `e2e-spec` | `nx g @gamestore/workspace:e2e-spec --app=web --name=theme-preview` | Playwright spec scaffold |

#### Generator conventions (enforce in every generator)

- **Tags:** `type:feature|ui|data-access|integration`, `scope:web|api|shared`, `platform:steam|payments|database`
- **Import paths:** `@gamestore/web/feature-catalog`, `@gamestore/shared/theme`, `@gamestore/shared/seo`, `@gamestore/api/prisma`
- **Setup-only integrations:** Stripe, Steam, SEO generators create files + return setup text — no SDK calls
- **UI shell pattern:** Components render static structural labels — CRUD data from real API only
- **Service pattern (CRUD):** Inject real `PrismaService` — never fake game/license data
- **Test pattern:** Co-generate `*.spec.ts` with mocked dependencies via `test-utils` factories

#### Example: `web-feature` generator output

```
libs/web/feature-catalog/
├── src/
│   ├── index.ts
│   ├── lib/
│   │   ├── catalog-page.tsx              # static shell + real API hook (empty state OK)
│   │   └── components/
│   │       ├── catalog-hero.tsx
│   │       ├── catalog-filters.tsx
│   │       ├── catalog-grid.tsx          # renders real games[] or empty state
│   │       └── catalog-game-card.tsx
│   └── catalog-page.spec.tsx             # mocks API client in test only
```

### 0.4 Nx project graph & task targets

Configure in `nx.json` / project configs:

| Target | Projects | Notes |
|---|---|---|
| `lint` | all | ESLint |
| `test` | libs + apps | Vitest — mocks allowed here |
| `e2e` | `web-e2e`, `api-e2e` | Playwright — real services |
| `build` | `web`, `api` | Production build |
| `serve` | `web`, `api` | Dev servers |
| `prisma-generate` | `api-prisma` | `prisma generate` |
| `prisma-migrate` | `api-prisma` | dev migrations |
| `db-seed` | `api-prisma` | seed test data for dev/e2e |

### 0.5 Deliverables checklist

- [ ] Nx workspace initialized at repo root
- [ ] `@gamestore/workspace` plugin with all generators listed above
- [ ] `nx g @gamestore/workspace:init-workspace` creates base apps/libs
- [ ] ESLint rule or CI check: no `*.mock.ts` / `*.stub.ts` outside `**/*.spec.ts` / `test-utils`
- [ ] `.env.example` with all required keys (empty values), including SEO vars

---

## Phase 1 — Theme Setup + Display UI Preview

**Goal:** Establish the design system foundation and a **Theme Preview** page to validate tokens once design specs arrive.

**Depends on:** Phase 0 (`theme-lib`, `ui-lib` generators)

**No store pages yet** — only tokens + showcase.

### 1.1 Theme library (`libs/shared/theme`)

Generate:

```bash
pnpm nx g @gamestore/workspace:theme-lib
```

Include:

| Asset | Purpose |
|---|---|
| `tokens/colors.ts` | Semantic palette slots (primary, surface, accent, danger, …) — values TBD |
| `tokens/typography.ts` | Font families, sizes, weights |
| `tokens/spacing.ts` | Spacing scale |
| `tokens/radius.ts` | Border radius scale |
| `tokens/shadows.ts` | Elevation / glassmorphism vars |
| `styles/globals.css` | CSS variables mapped from tokens |
| `tailwind.preset.ts` | Tailwind preset exporting theme tokens |
| `ThemeProvider.tsx` | Applies CSS vars + dark mode class |

### 1.2 Shared UI primitives (`libs/shared/ui`)

Generate minimal primitives with real themed styling:

- `Text`, `Heading`, `Button`, `Card`, `Badge`, `Input`, `Container`, `Stack`, `EmptyState`

Each component uses theme tokens only (no hardcoded hex except token fallbacks).

### 1.3 Theme Preview app route

Add route in `apps/web`: **`/dev/theme-preview`**

Sections on the page (static layout, no external data):

1. Color swatches (all semantic tokens)
2. Typography scale
3. Button variants
4. Card / glass panel samples
5. Form controls
6. Spacing/radius demonstration grid

> When you share the design later, we only update `libs/shared/theme` tokens — not page structure.

### 1.4 Phase 1 tests

| Test | Type | Asserts |
|---|---|---|
| ThemeProvider renders | unit | Provider mounts without error |
| CSS vars exist | unit | Document has `--color-primary` (or named token) |
| Theme preview page loads | e2e (real browser) | `/dev/theme-preview` shows "Theme Preview" heading |

```bash
pnpm nx g @gamestore/workspace:e2e-spec --app=web --name=theme-preview
pnpm nx e2e web-e2e --grep=theme-preview
```

### 1.5 Exit criteria

- [ ] Theme tokens centralized in one lib
- [ ] Preview page demonstrates all primitives
- [ ] Dark theme class strategy decided (class-based `dark` on `<html>`)
- [ ] You can swap token values without touching feature libs

---

## Phase 2 — Frontend Scaffold (Pages, Component Trees, E2E)

**Goal:** Create all customer-facing routes and **component trees per page** with static UI labels, theme applied, and **real API client** wired (returns empty states until backend has data).

**Depends on:** Phase 1

### 2.1 Generate web app shell

```bash
pnpm nx g @gamestore/workspace:init-workspace   # if not already done
```

App shell files:

- `app/layout.tsx` — wraps with `ThemeProvider`, header, footer; minimal static `metadata: { title: 'GameStore' }` only
- `app/page.tsx` — re-exports Home feature
- `app/robots.ts` — **setup shell** (returns minimal rules; full rules implemented later)
- `app/sitemap.ts` — **setup shell** (returns empty array or static `['/']` with TODO comment)
- `components/layout/site-header.tsx`
- `components/layout/site-footer.tsx`

### 2.2 API client library (`libs/web/data-access`)

Real HTTP client — no mocked responses in app code:

```typescript
// libs/web/data-access/src/lib/api-client.ts
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
```

Use Next.js Route Handlers as BFF proxy (`apps/web/app/api/[...path]/route.ts`) forwarding to the real NestJS API.

### 2.3 Pages & feature libs to generate

Use `web-feature` + `web-page-tree` for each:

| Route | Feature lib | Component tree |
|---|---|---|
| `/` | `feature-home` | `HomeHero`, `HomeFeaturedGrid`, `HomePromoBanner` |
| `/shop` | `feature-catalog` | `CatalogHero`, `CatalogSearch`, `CatalogFilters`, `CatalogGrid`, `GameCard` |
| `/games/[slug]` | `feature-game-detail` | `GameDetailHero`, `GameDetailInfo`, `GameDetailBuyPanel`, `GameDetailRequirements` |
| `/checkout` | `feature-checkout` | `CheckoutSummary`, `CheckoutPayment`, `CheckoutTerms` |
| `/checkout/success` | `feature-checkout` | `CheckoutSuccessMessage`, `CheckoutLicenseDisplay` |
| `/my-games` | `feature-my-games` | `LicenseKeyForm`, `ActivationSteps`, `CredentialsPanel`, `SteamGuardPanel` |
| `/faq` | `feature-faq` | `FaqAccordion`, `FaqContactCta` |
| `/contact` | `feature-contact` | `ContactForm`, `ContactInfo` |

Each page must:

- Use shared UI + theme tokens
- Call real API endpoints via `libs/web/data-access` (empty array / 404 is valid)
- Show `<EmptyState>` when API returns no data — **not** hardcoded fake game lists
- Export a single public component from the feature lib

Static UI labels (component section headers) are fine; fake data is not.

### 2.4 Navigation wiring

Header nav links to all routes above. Static links only (no active-state logic yet).

### 2.5 SEO setup (`libs/shared/seo`) — **config & files only**

Generate:

```bash
pnpm nx g @gamestore/workspace:seo-lib
```

**Goal:** Create SEO **file structure, env vars, and empty helpers** — **do not implement** full metadata, Open Graph, JSON-LD, or dynamic sitemap in this plan.

#### 2.5.1 SEO library structure (shell files)

```
libs/shared/seo/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── site-config.ts              # reads env vars; exports constants only
│       ├── metadata/
│       │   ├── build-page-metadata.ts  # empty function body + TODO(implement-seo)
│       │   └── build-game-metadata.ts  # empty function body + TODO(implement-seo)
│       ├── json-ld/                    # empty folder with README.md explaining future schemas
│       └── sitemap/
│           └── build-sitemap.ts        # returns [] + TODO(implement-seo)
```

#### 2.5.2 Environment variables (document in `.env.example` only)

```env
NEXT_PUBLIC_SITE_URL=http://localhost:4200
NEXT_PUBLIC_SITE_NAME=GameStore
NEXT_PUBLIC_DEFAULT_OG_IMAGE=/og/default.png
```

Values are read by `site-config.ts` but **not used for full metadata yet**.

#### 2.5.3 What to create now vs skip

| Item | Now (setup) | Skip until post-plan |
|---|---|---|
| `libs/shared/seo` lib | ✅ file shell | — |
| Root layout title | ✅ static `"GameStore"` | title template, description |
| Per-page `generateMetadata` | ❌ | ✅ all routes |
| `openGraph` / `twitter` tags | ❌ | ✅ |
| JSON-LD (`Organization`, `Product`) | ❌ | ✅ |
| Dynamic sitemap from DB | ❌ | ✅ |
| `robots.ts` / `sitemap.ts` | ✅ minimal shell files | full rules + game URLs |
| OG image asset | ✅ placeholder file in `public/og/` | branded creative |

#### 2.5.4 Dev preview route (optional)

`apps/web/app/dev/seo-preview/page.tsx` — displays visible setup text:

> "SEO — setup complete. Full metadata not implemented yet."

Lists env vars from `site-config` (site name, URL) as proof of wiring.

#### 2.5.5 SEO tests (setup verification only)

| Test | Type | Asserts |
|---|---|---|
| `site-config.spec.ts` | unit | Reads env vars without throwing |
| `seo-setup.spec.ts` | e2e | `/dev/seo-preview` shows setup message |

**Do not** test OG tags, JSON-LD, or canonical URLs in this plan.

### 2.6 Frontend unit tests (mocks allowed here)

One test per feature lib — **mock the API client in spec files only**:

```tsx
// catalog-page.spec.tsx
vi.mock('@gamestore/web/data-access', () => ({
  getGames: vi.fn().mockResolvedValue([]),
}));

expect(screen.getByText(/No games yet/i)).toBeInTheDocument();
```

### 2.7 E2E test suite (Playwright — real API)

E2E runs against real `web` + `api` + Neon dev branch. No MSW in e2e.

| Spec file | Coverage |
|---|---|
| `theme.spec.ts` | Theme preview reachable |
| `navigation.spec.ts` | All nav links return 200 |
| `pages.spec.ts` | Each route renders (empty states OK) |
| `responsive.spec.ts` | Home + catalog at mobile viewport |
| `seo-setup.spec.ts` | `/dev/seo-preview` shows SEO setup text |

```bash
pnpm nx e2e web-e2e
```

### 2.8 Exit criteria

- [ ] All MVP routes exist with component folders (tree structure)
- [ ] Theme applied globally via layout
- [ ] API client calls real backend endpoints (404/empty OK pre-Phase 6)
- [ ] `libs/shared/seo` shell exists with env-driven `site-config`
- [ ] `robots.ts` / `sitemap.ts` shell files exist (minimal content)
- [ ] `/dev/seo-preview` shows setup message (optional route)
- [ ] E2E green for navigation + page smoke tests
- [ ] Stripe / Steam / SEO **not implemented** — only file shells where applicable

---

## Phase 3 — Prisma + Neon Database

**Goal:** Install Prisma, configure Neon PostgreSQL, define schema, run migrations, verify connectivity with a **real health query**.

**Depends on:** Phase 0 (`init-workspace`, `integration-lib`)

### 3.1 Neon setup (manual — outside repo)

1. Create Neon project + database
2. Copy pooled connection string (`?sslmode=require`)
3. Create branches: `main` (prod), `dev` (local), `ci` (CI pipeline)

### 3.2 Environment variables

Add to `.env.example` and local `.env`:

```env
# Neon
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"

# App
NODE_ENV=development

# SEO (also required in Phase 2)
NEXT_PUBLIC_SITE_URL=http://localhost:4200
NEXT_PUBLIC_SITE_NAME=GameStore
NEXT_PUBLIC_DEFAULT_OG_IMAGE=/og/default.png
```

### 3.3 Prisma library

Generate:

```bash
pnpm nx g @gamestore/workspace:integration-lib --name=prisma
```

Structure:

```
libs/api/prisma/
├── src/
│   ├── index.ts              # exports PrismaClient singleton
│   └── lib/
│       └── prisma.service.ts # Nest injectable — real PrismaClient
├── prisma/
│   ├── schema.prisma
│   └── seed.ts               # real seed data for dev/e2e
└── project.json
```

### 3.4 Initial schema (from existing domain docs)

| Model | Purpose |
|---|---|
| `Game` | Catalog item (+ SEO fields below) |
| `GamePricingRegion` | PPP regional price (optional in MVP) |
| `GameAccount` | Steam account pool entry |
| `License` | Purchased / assigned license key |

**SEO fields on `Game`** (schema only — used when SEO is **implemented after this plan**):

| Field | Type | Purpose |
|---|---|---|
| `metaTitle` | `String?` | Override `<title>` (falls back to `title`) |
| `metaDescription` | `String?` | Override meta description (falls back to truncated `description`) |
| `ogImage` | `String?` | Override OG image URL (falls back to `coverImage` → site default) |
| `publishedAt` | `DateTime?` | Sitemap `lastModified`; null = draft (excluded from sitemap) |

### 3.5 Commands & verification

```bash
pnpm nx run api-prisma:prisma-generate
pnpm nx run api-prisma:prisma-migrate -- --name init
pnpm nx run api-prisma:db-seed
```

Real health check endpoint:

```
GET /health/db → { status: "ok", latencyMs: 12 }
```

Implementation: `await prisma.$queryRaw\`SELECT 1\`` — real query against Neon.

### 3.6 Tests

| Test | Type | Approach |
|---|---|---|
| Prisma connects | integration | Real Neon dev branch (or test branch) |
| Health endpoint | api e2e | Real HTTP call to `/health/db` |
| Repository unit tests | unit | **Mock** `PrismaClient` in `*.spec.ts` only |

### 3.7 Exit criteria

- [ ] Prisma client generates successfully
- [ ] Migration applies to Neon dev branch
- [ ] Seed script inserts real test rows
- [ ] `/health/db` returns OK with real latency
- [ ] No fake DB layer in application code

---

## Phase 4 — Stripe Payments (**Setup Only**)

**Goal:** Install Stripe dependency, add env vars, create module + routes + UI wiring. Endpoints **return setup text only** — no Stripe SDK calls, no Checkout Sessions, no webhooks.

**Depends on:** Phase 3, Phase 2 (checkout pages exist)

### 4.1 Stripe library (shell)

```bash
pnpm nx g @gamestore/workspace:integration-lib --name=stripe
```

```
libs/api/stripe/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── stripe.config.ts          # reads env vars; validates format only (no API call)
│       ├── stripe.service.ts         # returns setup text — TODO(implement-stripe)
│       └── stripe-webhook.controller.ts  # returns setup text — TODO(implement-stripe)
```

Add `stripe` to `package.json` but **do not instantiate** `new Stripe()` in service methods yet.

### 4.2 Environment variables

Document in `.env.example` (values optional until implementation):

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### 4.3 API routes (setup text only)

| Method | Route | Response |
|---|---|---|
| POST | `/api/payments/checkout` | `{ status: "setup", integration: "stripe", message: "Stripe checkout — not implemented yet" }` |
| POST | `/api/payments/webhook` | `{ status: "setup", integration: "stripe", message: "Stripe webhook — not implemented yet" }` |
| GET | `/api/payments/health` | `{ status: "setup", integration: "stripe", message: "Stripe — configured, not implemented yet" }` |

### 4.4 Frontend wiring (display setup text)

In `feature-checkout`:

- `CheckoutPayment` button calls `POST /api/payments/checkout`
- Renders the returned **setup message as visible text** on the page
- **No** redirect to Stripe Checkout

### 4.5 Tests

| Test | Type | Asserts |
|---|---|---|
| Stripe routes exist | api e2e | All 3 routes return 200 + setup JSON |
| Checkout UI | web e2e | Click pay → page shows setup message text |

### 4.6 Exit criteria

- [ ] Stripe lib + routes exist
- [ ] Env vars documented in `.env.example`
- [ ] Frontend checkout page displays setup text from API
- [ ] **No** Stripe SDK calls, **no** real payments

---

## Phase 5 — Steam Integration (**Setup Only**)

**Goal:** Install `steam-totp` dependency, add env vars, create module + routes + UI wiring. Endpoints **return setup text only** — no TOTP generation, no encryption, no account logic.

**Depends on:** Phase 3 (schema has `GameAccount` fields for future use)

### 5.1 Steam library (shell)

```bash
pnpm nx g @gamestore/workspace:integration-lib --name=steam
```

```
libs/api/steam/
├── src/
│   └── lib/
│       ├── steam.config.ts             # reads env vars only
│       ├── steam-guard.service.ts      # returns setup text — TODO(implement-steam)
│       └── steam-account.service.ts    # returns setup text — TODO(implement-steam)
```

Add `steam-totp` to `package.json` but **do not call** `generateAuthCode()` yet.

### 5.2 Environment variables

Document in `.env.example` (values optional until implementation):

```env
STEAM_ENCRYPTION_KEY=
STEAM_GUARD_COOLDOWN_MINUTES=15
```

### 5.3 API routes (setup text only)

| Method | Route | Response |
|---|---|---|
| POST | `/api/steam/guard-code` | `{ status: "setup", integration: "steam", message: "Steam Guard — not implemented yet" }` |
| GET | `/api/steam/health` | `{ status: "setup", integration: "steam", message: "Steam — configured, not implemented yet" }` |

### 5.4 Frontend wiring (display setup text)

In `feature-my-games`:

- `SteamGuardPanel` button calls `POST /api/steam/guard-code`
- Renders the returned **setup message as visible text**
- **No** TOTP code display

### 5.5 Tests

| Test | Type | Asserts |
|---|---|---|
| Steam routes exist | api e2e | Routes return 200 + setup JSON |
| My Games UI | web e2e | Click guard button → page shows setup message text |

### 5.6 Exit criteria

- [ ] Steam lib + routes exist
- [ ] Env vars documented in `.env.example`
- [ ] Frontend my-games page displays setup text from API
- [ ] **No** `steam-totp` calls, **no** password encryption yet

---

## Phase 6 — Backend CRUD + Frontend Connection + E2E

**Goal:** NestJS API with **real Prisma CRUD** for games/licenses/accounts, frontend consuming real DB data, full-stack e2e against real Neon. Stripe, Steam, and SEO **remain setup-only** (text responses).

**Depends on:** Phases 2, 3, 4, 5

### 6.1 API app bootstrap

```bash
pnpm nx g @nx/nest:application api --frontendProject=web
pnpm nx g @gamestore/workspace:init-workspace  # ensures api-e2e exists
```

### 6.2 Resource modules (real CRUD)

Generate each with `api-resource`:

| Resource | Base path | Endpoints |
|---|---|---|
| Games | `/api/games` | list, get by id/slug, create, update, delete |
| Licenses | `/api/licenses` | list, get, create, validate, revoke |
| Game Accounts | `/api/game-accounts` | list, get, create, deactivate |
| Orders | `/api/orders` | list, get — **setup text only** (Stripe not implemented) |

Each **CRUD** handler (games, licenses, game-accounts):

- Calls real repository → real Prisma → real Neon
- Returns real entities or real HTTP errors (`404`, `400`, `409`)

**Stripe / Steam routes** (from Phases 4–5) keep returning setup text — no license creation on webhook yet.

### 6.3 Data-access layer (real repositories)

```bash
pnpm nx g @gamestore/workspace:api-module --name=data-access
```

```
libs/api/data-access/
├── games.repository.ts           # prisma.game.findMany(), create(), etc.
├── licenses.repository.ts
├── game-accounts.repository.ts
└── orders.repository.ts
```

Unit tests for repositories **mock PrismaClient** in `*.spec.ts` only.

### 6.4 Connect frontend → backend (real data flow)

| Frontend feature | API call | UI behavior |
|---|---|---|
| `feature-catalog` | `GET /api/games` | Renders real games from DB or `<EmptyState>` |
| `feature-game-detail` | `GET /api/games/:slug` | Real game entity or 404 page |
| `feature-my-games` | `POST /api/licenses/validate` | Real license lookup from DB |
| `feature-my-games` | `POST /api/steam/guard-code` | Displays Steam **setup text** from API |
| `feature-checkout` | `POST /api/payments/checkout` | Displays Stripe **setup text** from API |

BFF proxy in Next forwards to NestJS — one consistent pattern from Phase 2.

### 6.5 SEO — **not implemented in Phase 6**

SEO stays at Phase 2 setup level. Game pages use default layout title only.

Full `generateMetadata`, JSON-LD, and dynamic sitemap → **post-plan** (see below).

### 6.6 API E2E tests (real HTTP + real DB)

```bash
pnpm nx g @gamestore/workspace:e2e-spec --app=api --name=crud
```

| Spec | Asserts |
|---|---|
| `games.crud.spec.ts` | Create game in DB → GET returns same entity → DELETE removes it |
| `licenses.crud.spec.ts` | Validate seeded license → returns real license row |
| `stripe-setup.spec.ts` | Checkout route returns setup text (not real payment) |
| `steam-setup.spec.ts` | Guard route returns setup text (not real TOTP) |
| `health.spec.ts` | `/health`, `/health/db` return OK against real services |

Use Neon `ci` branch; reset between test runs via migration + seed.

### 6.7 Full-stack E2E tests (real stack)

| Spec | Flow |
|---|---|
| `catalog.spec.ts` | Seed game → open `/shop` → see real game title |
| `checkout-setup.spec.ts` | Checkout page shows Stripe setup message text |
| `steam-setup.spec.ts` | My Games page shows Steam setup message text |

```bash
pnpm nx e2e web-e2e
pnpm nx e2e api-e2e
```

### 6.8 Exit criteria

- [ ] All CRUD routes persist to Neon and return real entities
- [ ] Frontend displays real DB data for games/licenses
- [ ] Stripe + Steam routes still return setup text (not implemented)
- [ ] SEO still at file-shell level (not implemented)
- [ ] API + web e2e pipelines green against real Neon in CI
- [ ] Mocks exist **only** in `*.spec.ts` and `libs/testing/test-utils`

---

## Testing Strategy Summary

```mermaid
flowchart LR
    subgraph app [Application Code]
        A1[Real Prisma CRUD]
        A2[Stripe setup text]
        A3[Steam setup text]
        A4[SEO file shell]
    end

    subgraph unit [Unit Tests *.spec.ts]
        U1[Mock PrismaClient]
        U2[Mock when implementing Stripe/Steam]
    end

    subgraph e2e [E2E Tests]
        E1[Real Neon ci branch]
        E2[Real NestJS CRUD]
        E3[Assert setup text for Stripe/Steam]
    end

    app --> e2e
    unit -->|mocks OK| U1
```

| Layer | Mocks? | Notes |
|---|---|---|
| CRUD / DB | **Never** in app code | Real Neon |
| Stripe / Steam / SEO | Setup text in app code | Full impl post-plan |
| `*.spec.ts` | **Yes** | Mock dependencies |
| Playwright e2e | **Never mock HTTP** | Real API; assert setup text for Stripe/Steam |

---

## Phase Execution Order (Summary)

```mermaid
flowchart TD
    P0[Phase 0: Nx + Generators] --> P1[Phase 1: Theme + Preview UI]
    P1 --> P2[Phase 2: Frontend + SEO Shell + API Client + E2E]
    P2 --> P3[Phase 3: Prisma + Neon]
    P3 --> P4[Phase 4: Stripe Setup Only]
    P3 --> P5[Phase 5: Steam Setup Only]
    P4 --> P6[Phase 6: Real CRUD + Full Stack E2E]
    P5 --> P6
    P2 --> P6
```

| Phase | Focus | Mocks allowed? |
|---|---|---|
| **0** | Nx workspace + `@gamestore/workspace` generators | Test scaffolds only |
| **1** | Theme tokens + preview page | Unit tests only |
| **2** | Routes + component trees + SEO shell + real API client | Unit tests only |
| **3** | Prisma schema + Neon + seed + health | Unit tests only |
| **4** | Stripe deps + routes → setup text | Unit tests only |
| **5** | Steam deps + routes → setup text | Unit tests only |
| **6** | Real CRUD + frontend wiring + e2e | Unit tests only |

---

## Nx Commands Cheat Sheet

```bash
# Scaffold
pnpm nx g @gamestore/workspace:init-workspace
pnpm nx g @gamestore/workspace:web-feature --name=catalog --route=/shop
pnpm nx g @gamestore/workspace:seo-lib
pnpm nx g @gamestore/workspace:api-resource --resource=games

# Develop
pnpm nx serve web
pnpm nx serve api

# Verify
pnpm nx run-many -t lint,test
pnpm nx e2e web-e2e
pnpm nx e2e api-e2e

# Database
pnpm nx run api-prisma:prisma-generate
pnpm nx run api-prisma:prisma-migrate
pnpm nx run api-prisma:db-seed
```

---

## CI Pipeline (recommended)

```yaml
# .github/workflows/ci.yml (to add in Phase 0)
jobs:
  verify:
    env:
      DATABASE_URL: ${{ secrets.NEON_CI_DATABASE_URL }}
    steps:
      - pnpm install
      - pnpm nx run api-prisma:prisma-migrate
      - pnpm nx run api-prisma:db-seed
      - pnpm nx run-many -t lint,test --parallel=3
      - pnpm nx e2e api-e2e      # real CRUD + setup-route checks
      - pnpm nx e2e web-e2e      # real browser + real API
```

Use Neon **branch databases** for CI (`DATABASE_URL` secret per environment).

---

## What Comes After This Plan (Out of Scope Here)

Once all phases pass exit criteria, **implement** Stripe, Steam, and SEO for real — then add business rules:

### Integration implementation (do these first)

| # | Integration | What to build |
|---|---|---|
| I.1 | **Stripe** | Real Checkout Sessions, webhook signature verification, `checkout.session.completed` → create `License` |
| I.2 | **Steam** | Real `steam-totp`, AES-256 password encryption, account pool assignment, cooldown queue |
| I.3 | **SEO** | Full `generateMetadata` per route, Open Graph, Twitter cards, JSON-LD, dynamic sitemap from DB, Search Console |

### Business features (after integrations)

1. IGDB metadata seeder (feeds SEO descriptions + OG images)
2. Smart 2FA queue / login cooldown
3. Account health monitor + Discord alerts
4. Geo-IP PPP pricing + `hreflang` alternate URLs per locale
5. Multi-language routing (`/en`, `/ar`, …) with localized metadata
6. SEO blog & game guides (`/guides/[slug]`) — see `mvp_structure_and_roadmap.md` P4.3
7. Deploy (Vercel + API host + Neon prod)

---

## Decisions Needed From You Before Phase 1

| # | Decision | Options | Default if no answer |
|---|---|---|---|
| 1 | Package manager | pnpm / npm / yarn | **pnpm** |
| 2 | Backend framework | NestJS / Fastify | **NestJS** (best Nx integration) |
| 3 | API ↔ Web communication | BFF proxy in Next / direct API URL | **Next Route Handlers proxy** |
| 4 | CSS approach | Tailwind + CSS vars / CSS Modules | **Tailwind + CSS vars** |
| 5 | Unit test runner | Vitest / Jest | **Vitest** |
| 6 | Default locale | `en` only / multi-locale from day one | **`en` only** in Phases 1–6; hreflang in post-MVP |

---

## Document Map

| File | Role |
|---|---|
| `IMPLEMENTATION_PLAN.md` | **This file** — Nx execution plan (CRUD real; Stripe/Steam/SEO setup-only) |
| `README.md` | Product architecture & advanced features reference |
| `mvp_structure_and_roadmap.md` | MVP feature prioritization after scaffold is complete |

---

*Next step: Run **Phase 0** — initialize Nx workspace and implement `@gamestore/workspace` generators. Share theme design specs when ready for Phase 1 token values.*
