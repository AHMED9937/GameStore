# Discord support bot (D.2+ smart support)

Always-on process that answers FAQ-style questions in Discord, uses Gemini when needed, and escalates hard cases to the owner.

## Prerequisites (manual)

1. **Bot token** in root `.env` as `DISCORD_BOT_TOKEN` / `DISCORD_GUILD_ID`
2. Discord Developer Portal → your app → **Bot** → enable:
   - **Message Content Intent** (required)
   - Server Members Intent (optional)
3. Re-invite bot with **Send Messages**, **Read Message History**, **View Channels**, **Use Slash Commands**
4. Add to root `.env`:

```env
DISCORD_OWNER_USER_ID=          # right-click your user → Copy User ID (Developer Mode)
GEMINI_API_KEY=                 # https://aistudio.google.com/apikey (optional; deterministic FAQ works without it)
# GEMINI_MODEL=gemini-2.0-flash
# DISCORD_STAFF_ROLE_ID=        # optional — ping @Staff on new auto-tickets
# DISCORD_TICKETS_CHANNEL_ID=   # optional — from pnpm discord:setup output
# DISCORD_POST_HELP_STICKY=true # optional — post welcome message in general-help on startup (once per restart)
```

5. Open a DM channel with the bot once (owner escalations), or rely on `#owner-escalations`.

## Run

```bash
pnpm discord:bot
# or
pnpm nx serve discord-bot
```

Restart the bot after code changes (stop terminal, run again).

## Behavior

| Channel | Behavior |
|---------|----------|
| `❓ \| general-help` | Replies to questions, @mentions, or phrases like "cant login" / "not working" |
| `🎫 \| tickets` forum | Bot **auto-opens** a private thread on escalate / "still not working"; staff ping optional |
| Slash commands | `/help`, `/faq topic:…`, `/ticket` |
| Sensitive topics (refund, ban, payment) | Escalates: DM owner + `#owner-escalations` (deduped 10 min) |
| Password / Steam Guard / license key | Redirects to **My Games** on website — never posts secrets |
| Pasted license key in chat | Warns user + escalates staff |

## Intelligence pipeline

1. **Safety gates** — pasted license keys, requests for secrets (no LLM)
2. **Gemini (primary)** when `GEMINI_API_KEY` is set:
   - Retrieves top 5 FAQ docs + intent hint
   - Multi-turn conversation sent as real Gemini `user`/`model` turns
   - Structured JSON schema output (reply, confidence, escalate, intent)
   - Rich system prompt: synthesis, follow-ups, links, examples
3. **Fallback** — keyword FAQ only if Gemini fails or no API key

## Safety

- No credentials in Discord replies
- Per-user rate limit (~15s)
- Ignores `@everyone` spam and embed-only messages
- Structured JSON audit logs to stdout (no raw PII)
- Publish announcements stay on Nest webhook (D.1) — this bot does not post new games

## Tests

```bash
pnpm nx test discord-bot
```

Eval cases: `src/eval/support-cases.json` (43 labeled messages).

## Deploy (production)

Discord gateway needs a **long-lived process** (not serverless).

### Railway / Fly.io / VPS

1. Create a service with Node 20+
2. Set env vars from `.env` (never commit secrets)
3. Start command: `pnpm discord:bot` or `tsx apps/discord-bot/src/main.ts`
4. Use **restart on failure** policy
5. Recommended: separate Discord application for dev vs prod bots

### systemd example (Linux VPS)

```ini
[Unit]
Description=GameStore Discord Support Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/gamestore
EnvironmentFile=/opt/gamestore/.env
ExecStart=/usr/bin/pnpm discord:bot
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Health

- Bot logs `[metrics]` hourly to stdout
- Optional: set `DISCORD_POST_HELP_STICKY=true` only on first deploy
- Watch `#owner-escalations` volume — spike means KB gap or outage

## See also

- [DISCORD_PLAN.md](../../AppImplemntionPlan/DISCORD_PLAN.md) — server setup + publish webhook
- [DISCORD_BOT_AI_PLAN.md](../../AppImplemntionPlan/DISCORD_BOT_AI_PLAN.md) — smart bot design
