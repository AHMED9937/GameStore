# @gamestore/api/paddle

Paddle Billing integration for the GameStore API.

| Environment variable | Used by | Description |
|---|---|---|
| `PADDLE_API_KEY` | NestJS API | `pdl_sdbx_...` or `pdl_live_...` server-side API key |
| `PADDLE_NOTIFICATION_WEBHOOK_SECRET` | NestJS API | Secret from Paddle notification destination |
| `NEXT_PUBLIC_PADDLE_ENV` | Next.js / API | `sandbox` or `production` |

## Build & test

```bash
pnpm nx build api-paddle
pnpm nx test api-paddle
```
