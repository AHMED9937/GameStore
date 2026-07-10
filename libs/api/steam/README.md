# @gamestore/api/steam

Steam integration shell (Phase 5 setup only). No TOTP generation or password decryption yet.

## Environment variables

Documented in the workspace root `.env.example`. All values are **optional** until Guard is implemented.

| Variable | Used by | Format |
|---|---|---|
| `STEAM_ENCRYPTION_KEY` | NestJS API | 64-char hex (32 bytes) or 32+ char secret |
| `STEAM_GUARD_COOLDOWN_MINUTES` | NestJS API | Positive integer minutes (default `15`) |

`SteamConfig.readEnv()` reads these from `process.env`. `SteamConfig.getEnvStatus()` validates format only no crypto or `steam-totp` calls.

## Commands

```bash
pnpm nx build api-steam
pnpm nx test api-steam
```
