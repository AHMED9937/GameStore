# Phase 2 Frontend Scaffold Plan

This document is the **detailed execution plan for Phase 2** of GameStore. It expands [implementation_plan.md](./implementation_plan.md) into reviewable slices.

**Parent plan:** [implementation_plan.md](./implementation_plan.md)  
**Design reference:** [`../_docs_backup/mockup.html`](../_docs_backup/mockup.html)  
**Theme (Phase 1 done):** `libs/shared/theme`, `libs/shared/ui`, `/dev/theme-preview`

---

## Phase 2 goal

Create all **customer-facing routes** and **component trees per page** with:

- Theme applied (Amethyst & Aqua Neon from mockup)
- Static UI structure matching the mockup layout
- **Real API client** wired (empty states / 404 OK until Phase 6)
- **SEO shell only** (no full metadata implementation)
- Playwright + unit smoke tests

**Not in Phase 2:** real game data, Stripe checkout, Steam Guard, full SEO, business logic.

---

## Prerequisites (must be complete)

| Phase | Status | Notes |
|---|---|---|
| Phase 0 Nx + generators | ✅ Done | `@gamestore/workspace` plugin |
| Phase 1 Theme + UI preview | ✅ Done | Tokens from mockup, `/dev/theme-preview` |
| `apps/web` | ✅ Exists | Next.js App Router |
| `apps/api` | ✅ Exists | NestJS (API calls may 404 until Phase 6) |

---

## Rules for Phase 2

### No-mock policy (application code)

| Allowed | Not allowed |
|---|---|
| Static section labels (`"CatalogGrid"`, `"HomeHero"`) | Hardcoded fake game lists or prices |
| Real `fetch` to API → `[]`, `404`, setup text | `vi.mock` / MSW in `apps/` or `libs/` |
| `<EmptyState message="No games yet" />` | Placeholder JSON pretending to be API data |
| Stripe/Steam setup text from API (Phase 4–5) | Fake payment codes or TOTP values |

### Generator-first

Use `@gamestore/workspace` generators do not hand-create feature lib folder structures.

```bash
pnpm nx g @gamestore/workspace:web-feature --name=<name> --route=<route>
pnpm nx g @gamestore/workspace:web-page-tree --page=<name> --components=hero,Filters,...
```

### Design alignment (mockup → Phase 2)

Phase 2 builds **structure + themed shells**, not full mockup polish. Map mockup sections to components:

| Mockup section | Route | Component tree |
|---|---|---|
| Header / nav | layout | `SiteHeader`, `SiteFooter` |
| `.hero` | `/` | `HomeHero`, `HomeFeaturedGrid`, `HomePromoBanner` |
| `.subscriptions` | `/` (partial) | `HomePromoBanner` |
| `.catalog` + Filters | `/shop` | `CatalogHero`, `CatalogSearch`, `CatalogFilters`, `CatalogGrid`, `GameCard` |
| Game detail (implied) | `/games/[slug]` | `GameDetailHero`, `GameDetailInfo`, `GameDetailBuyPanel`, `GameDetailRequirements` |
| Checkout flow | `/checkout`, `/checkout/success` | `CheckoutSummary`, `CheckoutPayment`, `CheckoutTerms`, `CheckoutSuccessMessage`, `CheckoutLicenseDisplay` |
| Activation portal | `/my-games` | `LicenseKeyForm`, `ActivationSteps`, `CredentialsPanel`, `SteamGuardPanel` |
| FAQ / footer links | `/faq` | `FaqAccordion`, `FaqContactCta` |
| Contact / newsletter | `/contact` | `ContactForm`, `ContactInfo` |

Missing mockup details (fill in during implementation):

- Game detail page layout → mirror catalog card + buy panel pattern from mockup
- FAQ accordion content → static placeholder questions
- Contact form fields → name, email, message (no submit logic)
- Mobile nav → hamburger shell in `SiteHeader` (no drawer logic required in Phase 2)

---

## Execution slices (review after each)

Work **one slice at a time**. After each slice: run verify commands → user reviews → then continue.

---

### Slice 2.1 App shell + layout (mockup header/footer)

**Goal:** Global layout with theme, header, footer no feature pages yet.

**Generators / files:**

```bash
# Manual updates to existing apps/web (no generator yet for shell)
```

| File | Action |
|---|---|
| `apps/web/src/app/layout.tsx` | Already has `ThemeProvider` + fonts add header/footer slots |
| `apps/web/src/components/layout/site-header.tsx` | **Create** logo, nav links, activate CTA, cart icon shell |
| `apps/web/src/components/layout/site-footer.tsx` | **Create** brand, links, newsletter shell (from mockup footer) |
| `apps/web/src/app/page.tsx` | Temporary placeholder until Slice 2.3 |
| `apps/web/src/app/robots.ts` | **Create** SEO setup shell |
| `apps/web/src/app/sitemap.ts` | **Create** SEO setup shell |

**Header nav links (static):**

- Shop → `/shop`
- My Games → `/my-games`
- FAQ → `/faq`
- Contact → `/contact`

**Mockup styling:** use `@gamestore/shared/ui` (`Button`, `Container`, `Badge`) + theme CSS vars. Header: sticky, glass blur, gradient logo text.

**Verify:**

```bash
pnpm nx dev web
# Visual check: header/footer on all pages
pnpm nx build web
```

**Exit criteria:**

- [ ] Header + footer render on every route
- [ ] Sticky glass header matches mockup feel
- [ ] Nav links present (no active-state logic)

---

### Slice 2.2 API client + BFF proxy

**Goal:** Real HTTP wiring from web → API (errors/empty OK).

**Generators:**

```bash
pnpm nx g @nx/js:library data-access --directory=libs/web/data-access --importPath=@gamestore/shared/data-access
# OR extend @gamestore/workspace with data-access generator (future)
```

> **Note:** If no generator exists yet, create `libs/web/data-access` manually with tags `scope:web,type:data-access` and add path to `tsconfig.base.json`.

**Files:**

```
libs/web/data-access/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── api-client.ts       # apiGet, apiPost, ApiError
│       ├── games.api.ts        # getGames(), getGameBySlug()
│       └── licenses.api.ts     # validateLicense() stub path for my-games
```

```
apps/web/src/app/api/[...path]/route.ts   # BFF proxy → NestJS API
```

**Env:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_URL=http://localhost:3000          # server-side proxy target (apps/api)
```

**Behavior:**

- `apiGet('/games')` → real fetch → returns `[]` or `404` until Phase 6
- No mocked responses in library code
- Proxy forwards `GET/POST/PUT/DELETE` to `apps/api`

**Verify:**

```bash
pnpm nx dev api
pnpm nx dev web
# curl http://localhost:4200/api/games  (or whatever port Next uses)
```

**Exit criteria:**

- [ ] `libs/web/data-access` exports typed API helpers
- [ ] BFF proxy forwards to NestJS
- [ ] Failed requests throw `ApiError` with status code

---

### Slice 2.3 Feature pages + component trees

**Goal:** All MVP routes with themed placeholder shells and component folders.

**Generate each feature:**

```bash
pnpm nx g @gamestore/workspace:web-feature --name=home --route=/
pnpm nx g @gamestore/workspace:web-page-tree --page=home --components=hero,featured-grid,promo-banner

pnpm nx g @gamestore/workspace:web-feature --name=catalog --route=/shop
pnpm nx g @gamestore/workspace:web-page-tree --page=catalog --components=hero,search,Filters,grid,card

pnpm nx g @gamestore/workspace:web-feature --name=game-detail --route=/games/[slug]
pnpm nx g @gamestore/workspace:web-page-tree --page=game-detail --components=hero,info,buy-panel,requirements

pnpm nx g @gamestore/workspace:web-feature --name=checkout --route=/checkout
pnpm nx g @gamestore/workspace:web-page-tree --page=checkout --components=summary,payment,terms

# checkout success route add app route manually or second web-feature
pnpm nx g @gamestore/workspace:web-feature --name=my-games --route=/my-games
pnpm nx g @gamestore/workspace:web-page-tree --page=my-games --components=license-form,activation-steps,credentials,steam-guard

pnpm nx g @gamestore/workspace:web-feature --name=faq --route=/faq
pnpm nx g @gamestore/workspace:web-page-tree --page=faq --components=accordion,contact-cta

pnpm nx g @gamestore/workspace:web-feature --name=contact --route=/contact
pnpm nx g @gamestore/workspace:web-page-tree --page=contact --components=form,info
```

**Per-page requirements:**

| Route | API call (real) | Empty / error UI |
|---|---|---|
| `/` | Optional `getGames()` for featured | `<EmptyState>` if empty |
| `/shop` | `getGames()` | `"No games yet"` empty state |
| `/games/[slug]` | `getGameBySlug(slug)` | 404 page if not found |
| `/checkout` | `POST /payments/checkout` | Show setup text response |
| `/checkout/success` | None | Static success shell |
| `/my-games` | `POST /licenses/validate`, `POST /steam/guard-code` | Setup text until Phase 5 |
| `/faq`, `/contact` | None | Static content shells |

**Component rules:**

- Each component renders its **section name** + themed container (glass card where appropriate)
- Catalog page uses mockup-inspired filter bar + search input (UI only, no filter logic)
- Game cards show `<EmptyState>` not sample game titles

**Verify:**

```bash
pnpm nx build web
# Visit each route manually
```

**Exit criteria:**

- [ ] All routes in table exist and render
- [ ] Each feature lib has `components/` tree
- [ ] Theme + shared UI used on every page
- [ ] No hardcoded fake catalog data

---

### Slice 2.4 SEO shell

**Goal:** SEO file structure only no full metadata.

```bash
pnpm nx g @gamestore/workspace:seo-lib
```

| Item | Action |
|---|---|
| `libs/shared/seo` | Shell lib with `site-config`, empty metadata builders |
| `apps/web/src/app/robots.ts` | Minimal rules |
| `apps/web/src/app/sitemap.ts` | Static `['/']` or empty + TODO |
| `apps/web/public/og/default.png` | Placeholder OG image |
| `apps/web/src/app/dev/seo-preview/page.tsx` | Shows setup message + env vars |

**Skip in Phase 2:**

- Per-page `generateMetadata`
- Open Graph / Twitter cards
- JSON-LD
- Dynamic sitemap from DB

**Verify:**

```bash
pnpm nx g @gamestore/workspace:e2e-spec --app=web --name=seo-setup
```

**Exit criteria:**

- [ ] `seo-lib` generated
- [ ] `/dev/seo-preview` shows setup text
- [ ] `robots.ts` + `sitemap.ts` return valid responses

---

### Slice 2.5 Unit tests (mocks in tests only)

**Goal:** One smoke test per feature lib.

| Lib | Test asserts |
|---|---|
| `feature-home` | Renders without crash |
| `feature-catalog` | Shows empty state when API returns `[]` (mock API in spec) |
| `feature-game-detail` | Shows not-found / empty when API 404 |
| `feature-checkout` | Renders checkout shell |
| `feature-my-games` | Renders activation shell |
| `feature-faq` | Renders FAQ shell |
| `feature-contact` | Renders contact shell |
| `shared/seo` | `site-config` reads env |

**Pattern (catalog example):**

```tsx
vi.mock('@gamestore/web/data-access', () => ({
  getGames: vi.fn().mockResolvedValue([]),
}));
expect(screen.getByText(/No games yet/i)).toBeInTheDocument();
```

**Verify:**

```bash
pnpm nx run-many -t test --projects=feature-home,feature-catalog,...
```

**Exit criteria:**

- [ ] Each feature lib has `*.spec.tsx`
- [ ] Mocks only inside `*.spec.ts` files

---

### Slice 2.6 E2E tests (real browser, real API)

**Goal:** Playwright smoke suite for navigation and pages.

```bash
pnpm nx g @gamestore/workspace:e2e-spec --app=web --name=navigation
pnpm nx g @gamestore/workspace:e2e-spec --app=web --name=pages
pnpm nx g @gamestore/workspace:e2e-spec --app=web --name=responsive
pnpm nx g @gamestore/workspace:e2e-spec --app=web --name=seo-setup
```

| Spec | Coverage |
|---|---|
| `theme.spec.ts` | `/dev/theme-preview` still works (regression) |
| `navigation.spec.ts` | All header links return 200 |
| `pages.spec.ts` | Each MVP route shows expected section heading |
| `responsive.spec.ts` | Home + `/shop` at 375px viewport no layout crash |
| `seo-setup.spec.ts` | `/dev/seo-preview` shows setup message |

**Config:** `apps/web-e2e/playwright.config.mts` use `pnpm nx dev web` as webServer.

**Verify:**

```bash
pnpm exec playwright test --config=apps/web-e2e/playwright.config.mts
```

**Exit criteria:**

- [ ] All e2e specs pass locally
- [ ] No MSW or mocked HTTP in e2e

---

## Target file tree after Phase 2

```
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # → feature-home
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── shop/page.tsx
│   ├── games/[slug]/page.tsx
│   ├── checkout/page.tsx
│   ├── checkout/success/page.tsx
│   ├── my-games/page.tsx
│   ├── faq/page.tsx
│   ├── contact/page.tsx
│   ├── dev/theme-preview/page.tsx  # Phase 1
│   ├── dev/seo-preview/page.tsx
│   └── api/[...path]/route.ts
├── components/layout/
│   ├── site-header.tsx
│   └── site-footer.tsx
libs/web/
├── data-access/
├── feature-home/
├── feature-catalog/
├── feature-game-detail/
├── feature-checkout/
├── feature-my-games/
├── feature-faq/
└── feature-contact/
libs/shared/
└── seo/                            # shell only
```

---

## Commands cheat sheet

```bash
# Develop
pnpm nx dev web
pnpm nx dev api

# Generate
pnpm nx g @gamestore/workspace:web-feature --name=catalog --route=/shop
pnpm nx g @gamestore/workspace:web-page-tree --page=catalog
pnpm nx g @gamestore/workspace:seo-lib

# Verify
pnpm nx build web
pnpm nx run-many -t test --projects=tag:scope:web
pnpm exec playwright test --config=apps/web-e2e/playwright.config.mts
```

---

## Phase 2 exit criteria (full checklist)

- [ ] **2.1** App shell: header, footer, layout wired
- [ ] **2.2** `libs/web/data-access` + BFF proxy to API
- [ ] **2.3** All MVP routes + component trees (no fake data)
- [ ] **2.4** SEO shell (`seo-lib`, robots, sitemap, seo-preview)
- [ ] **2.5** Unit smoke tests per feature (mocks in tests only)
- [ ] **2.6** E2E: navigation, pages, responsive, seo-setup
- [ ] Theme from Phase 1 applied globally
- [ ] Mockup-aligned structure (header, hero, catalog, glass cards)
- [ ] Stripe / Steam / full SEO **not implemented**

---

## What comes next (Phase 3+)

| Phase | Focus |
|---|---|
| **3** | Prisma + Neon (schema, migrate, health) |
| **4** | Stripe setup text → later real checkout |
| **5** | Steam setup text → later real TOTP |
| **6** | Real CRUD + frontend consumes real DB data |

---

## Document map

| File | Role |
|---|---|
| [implementation_plan.md](./implementation_plan.md) | Full monorepo blueprint (Phases 0–6) |
| **PHASE_2_PLAN.md** | **This file** Phase 2 slice-by-slice plan |
| [mvp_structure_and_roadmap.md](./mvp_structure_and_roadmap.md) | Product MVP priorities |
| [`../_docs_backup/mockup.html`](../_docs_backup/mockup.html) | Visual design reference |

---

*Start with **Slice 2.1** (app shell). Review after each slice before continuing.*
