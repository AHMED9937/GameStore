# GameStore

Nx monorepo for the GameStore platform.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Scaffold commands

```bash
pnpm nx g @gamestore/workspace:init-workspace
pnpm nx g @gamestore/workspace:theme-lib
pnpm nx g @gamestore/workspace:seo-lib
pnpm nx g @gamestore/workspace:ui-lib --name=all
pnpm nx g @gamestore/workspace:web-feature --name=catalog --route=/shop
pnpm nx g @gamestore/workspace:api-resource --resource=games
pnpm nx g @gamestore/workspace:integration-lib --name=stripe
pnpm nx g @gamestore/workspace:e2e-spec --app=web --name=theme-preview
```

## Verify

```bash
pnpm nx run-many -t lint
pnpm nx build gamestore-plugin
```
