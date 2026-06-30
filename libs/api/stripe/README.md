# @gamestore/api/stripe

Stripe integration shell (Phase 4 — setup only). No Checkout Sessions or webhooks yet.

## Environment variables

Documented in the workspace root `.env.example`. All values are **optional** until checkout is implemented.

| Variable | Used by | Format |
|---|---|---|
| `STRIPE_SECRET_KEY` | NestJS API | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | NestJS API | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Next.js (browser) | `pk_test_...` or `pk_live_...` |

`StripeConfig.readEnv()` reads these from `process.env`. `StripeConfig.getEnvStatus()` validates format only — no Stripe API calls.

## Commands

```bash
pnpm nx build api-stripe
pnpm nx test api-stripe
```
