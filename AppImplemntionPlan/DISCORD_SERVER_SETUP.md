# Discord Server Setup (Rkgame MVP)

Checklist for the lean community server. Prefer creating channels via a bot setup script after you paste `DISCORD_BOT_TOKEN`; use this doc as the source checklist.

**Canonical layout (full detail):** [DISCORD_PLAN.md §1](./DISCORD_PLAN.md#1-canonical-server-layout-channels)

## 1. Minimum human steps (required before `pnpm discord:setup`)

1. Create a Discord Application + Bot at [discord.com/developers](https://discord.com/developers/applications) → copy the bot token
2. Create (or pick) a server named to match the store (e.g. **Rkgame**)
3. Invite the bot with **Manage Channels**, **Manage Roles**, **Manage Webhooks**, **Manage Threads**, **Create Invite**
4. Put in root `.env`:

```env
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
```

(Enable Developer Mode → right-click server → Copy Server ID for `DISCORD_GUILD_ID`.)

## 2. Run automated setup

**Before first clean run:** In Discord, delete any half-created categories/channels from earlier attempts (especially a locked `{ STAFF }` category). Drag the bot role (**Offline Gamenia**) to the **top** of Server Settings → Roles.

```bash
# Clean recreate (recommended after a failed attempt)
pnpm discord:setup -- --wipe

# Or create only (idempotent — skips names that already exist)
pnpm discord:setup
```

The script creates roles/channels from [DISCORD_PLAN.md §1](./DISCORD_PLAN.md#1-canonical-server-layout-channels), configures the `🎫 | tickets` forum (tags, default reaction, post guidelines, welcome post), a webhook on `🎮 | new-games`, and an invite link. Copy the printed lines into `.env`.

Then:

1. Assign yourself the `Owner` role in Discord
2. Enable **Server Settings → Onboarding** so members self-assign `NewGames`
3. Restart Next.js (`pnpm nx dev web`)

### Tickets forum (completes Discord “Get Started” 3–5)

Re-run setup anytime — no `--wipe` needed if channels already exist:

```bash
pnpm discord:setup
```

| Checklist item | Automated setting |
|----------------|-------------------|
| Create tags | `Activation`, `Steam`, `Ubisoft`, `Billing`, `Account`, `Other` |
| Default reaction | 🎫 |
| Post guidelines | Required tag + no secrets in posts (shown on **New Post**) |
| First post | `📌 READ FIRST — How to open a ticket` |

Tags are encouraged for new tickets (enable **Require tag** in channel settings if you want it mandatory). Threads auto-archive after 7 days.

## 3. Roles

Create these roles (top → bottom):

| Role | Purpose |
|------|---------|
| `Owner` | You; receives bot escalations |
| `Staff` | Support moderators |
| `NewGames` | Opt-in ping for new catalog games (**prefer this over @everyone**) |
| `Subscriber` | Optional; paid subscribers |
| `Customer` | Optional; verified buyers |
| *(APP role)* | Discord creates this automatically for **Offline Gamenia** — do not create a separate `Bot` role |

Enable **Server Settings → Onboarding** (or a reaction-role message) so members can self-assign `NewGames`.

## 4. Channel layout (exact names)

```text
Rkgame
├── rules
│
├── { INFO }
│   ├── 📢 | announcements
│   ├── 🎮 | new-games
│   ├── ♻️ | restored-games
│   └── 🌐 | website
│
├── { GUIDES }
│   ├── 🔑 | how-to-activate
│   ├── 🔵 | ubisoft-offline
│   └── 🎮 | steam-offline
│
├── { HELP }
│   ├── ❓ | general-help
│   ├── 📞 | contact
│   └── 🎫 | tickets
│
└── { STAFF }          (private — Owner + Staff + Bot only)
    ├── 🚨 | staff-alerts
    └── 📬 | owner-escalations
```

| Category | Channel | Type | Who can post |
|----------|---------|------|--------------|
| (top) | `rules` | Rules | Staff only |
| `{ INFO }` | `📢 \| announcements` | Announcement | Staff + bot |
| `{ INFO }` | `🎮 \| new-games` | Text | Staff + webhook/bot |
| `{ INFO }` | `♻️ \| restored-games` | Text | Staff + bot |
| `{ INFO }` | `🌐 \| website` | Text | Staff (pin store URL) |
| `{ GUIDES }` | `🔑 \| how-to-activate` | Text | Staff |
| `{ GUIDES }` | `🔵 \| ubisoft-offline` | Text | Staff |
| `{ GUIDES }` | `🎮 \| steam-offline` | Text | Staff |
| `{ HELP }` | `❓ \| general-help` | Text | Everyone |
| `{ HELP }` | `📞 \| contact` | Text | Staff |
| `{ HELP }` | `🎫 \| tickets` | Forum | Private threads; tags + welcome post via `pnpm discord:setup` |
| `{ STAFF }` | `🚨 \| staff-alerts` | Text | Bot + Staff |
| `{ STAFF }` | `📬 \| owner-escalations` | Text | Bot |

**Skip for MVP:** member-count channel, `website-features`, duplicate `web-site`, `game-request`.

## 5. Permissions

- `announcements`, `new-games`, `restored-games`, all guides, `contact`: `@everyone` view only; Staff + Bot send
- `general-help`: everyone can chat
- `{ STAFF }`: hidden from `@everyone`
- Never allow license keys, passwords, or Steam Guard codes in public channels
- Create an **Incoming Webhook** on `🎮 | new-games` for publish announcements (or via setup script)

## 6. Invite + website

1. Create an invite (never expire; optional max uses)
2. Set in root `.env`:

```env
NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/your-invite
```

3. Restart Next.js (`pnpm nx dev web`)

The invite is used by FAQ CTA, game detail CTA, footer Discord link, and contact page.

## 7. Publish webhook (Phase 1 / D.1)

On `🎮 | new-games` → Integrations → Webhooks → New Webhook (or script output). Copy into Nest env:

```env
DISCORD_NEW_GAMES_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_NEW_GAMES_ROLE_ID=123456789012345678
```

`DISCORD_NEW_GAMES_ROLE_ID` is the snowflake for the `NewGames` role (right-click role → Copy Role ID with Developer Mode on).

Restart the API after setting these. Publishing a game (draft → published) posts an embed and pings `@NewGames`. If the webhook is unset, publish still succeeds (notify is skipped).

## 8. AI support bot (Phase 2 / D.2)

Bot listens on `❓ | general-help` and `🎫 | tickets`; escalations go to `📬 | owner-escalations` + Owner DM.

See [DISCORD_PLAN.md](./DISCORD_PLAN.md) Phase 2 and (when built) `apps/discord-bot/README.md`.
