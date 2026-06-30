# @gamestore/api/prisma

Prisma client + schema for GameStore (Neon PostgreSQL).

## Commands

```bash
pnpm nx run api-prisma:prisma-generate
pnpm nx run api-prisma:prisma-migrate-deploy   # apply migrations (needs .env)
pnpm nx run api-prisma:prisma-migrate -- --name <migration_name>  # new migrations (dev)
pnpm nx run api-prisma:db-seed
pnpm nx run api-prisma:prisma-studio
```

Schema: `libs/api/prisma/prisma/schema.prisma`

Requires `DATABASE_URL` and `DIRECT_URL` in `.env` (see root `.env.example`).
