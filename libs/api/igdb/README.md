# IGDB API library (`@gamestore/api/igdb`)

Server-side Twitch OAuth + IGDB v4 client for **admin-only** game metadata import. Credentials never reach the browser.

## Environment variables

Add to the repo root `.env` (see [`.env.example`](../../../.env.example)):

```env
IGDB_CLIENT_ID=your_twitch_client_id
IGDB_CLIENT_SECRET=your_twitch_client_secret
```

### Twitch app setup

1. Create an application at [https://dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Enable **IGDB API** access for the app (Twitch developer console)
3. Copy **Client ID** and **Client Secret** into `.env`
4. Restart Nest: `pnpm nx serve api`

`IgdbConfig.isConfigured()` requires both variables. Without them, admin routes return a `setup` JSON stub.

## Security model

- **Admin only** `GET/POST /api/admin/igdb/*` requires Clerk JWT + `role: admin`
- **Server-side OAuth** `IGDB_CLIENT_SECRET` is read only by Nest; never use `NEXT_PUBLIC_*` for IGDB keys
- **No storefront exposure** public `/api/games` never calls IGDB
- **Rate limited** IGDB routes use a stricter throttle (see `THROTTLE_LIMIT_IGDB` in `.env.example`)

## Admin UI

- Web: `/admin/igdb` search IGDB, configure platform/price, import draft game
- After import: redirects to `/admin/games/{id}/edit` for publish workflow

## API routes (Nest)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/igdb/health` | `{ configured, integration }` |
| `GET` | `/api/admin/igdb/search?q=` | Search titles (max 20) |
| `GET` | `/api/admin/igdb/preview/:igdbId` | Game details without DB write |
| `POST` | `/api/admin/igdb/import` | Import/update draft + media |
| `POST` | `/api/admin/games/:id/sync-igdb` | Re-sync existing game from IGDB |

## CLI import (dev)

```bash
pnpm nx run api-prisma:igdb-seed -- --igdb-id=12345 [--slug=my-game] [--platform=steam] [--price=9.99]
```

## Tests

```bash
pnpm nx test api-igdb
pnpm nx test api --testPathPattern=admin-igdb
```

Unit tests mock `fetch`; CI does not call the live IGDB API.

## Building

Run `nx build api-igdb` to build the library.
