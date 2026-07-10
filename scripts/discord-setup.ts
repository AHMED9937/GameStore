/**
 * D.0 — Discord server layout from AppImplemntionPlan/DISCORD_PLAN.md §1
 *
 * Prerequisites:
 *   DISCORD_BOT_TOKEN + DISCORD_GUILD_ID in root .env
 *   Bot invited with Manage Channels, Manage Roles, Manage Webhooks, Manage Threads, Create Instant Invite
 *   Bot role ("Offline Gamenia") at TOP of Server Settings → Roles
 *
 * Usage:
 *   pnpm discord:setup -- --wipe    # delete layout leftovers, then create (recommended)
 *   pnpm discord:setup              # create only (skips existing)
 *
 * Note: Discord replaces spaces in channel names with "-".
 *   Plan name "📢 | announcements" is stored as "📢-|-announcements".
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildTicketsForumPostGuidelines,
  buildTicketsWelcomePost,
  forumTagsMatch,
  TICKETS_FORUM_DEFAULT_REACTION,
  TICKETS_FORUM_TAGS,
} from './discord-forum-config';

function loadEnvFile(): void {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvFile();

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
  return value;
}

const TOKEN = requireEnv('DISCORD_BOT_TOKEN');
const GUILD_ID = requireEnv('DISCORD_GUILD_ID');
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';
const WIPE = process.argv.includes('--wipe');

const API = 'https://discord.com/api/v10';

const Perm = {
  ViewChannel: 1n << 10n,
  SendMessages: 1n << 11n,
  ReadMessageHistory: 1n << 16n,
  CreatePublicThreads: 1n << 35n,
  SendMessagesInThreads: 1n << 38n,
} as const;

function bits(...values: bigint[]): string {
  return values.reduce((a, b) => a | b, 0n).toString();
}

/** Discord turns spaces into "-"; compare names ignoring spaces/hyphens. */
function norm(name: string): string {
  return name.toLowerCase().replace(/[\s\-_|｜]+/g, '');
}

type Role = { id: string; name: string; position: number; managed: boolean };
type Channel = { id: string; name: string; type: number; parent_id: string | null };
type ForumChannel = Channel & {
  available_tags?: Array<{ id: string; name: string; emoji_name?: string | null }>;
  default_reaction_emoji?: { emoji_name?: string | null; emoji_id?: string | null } | null;
  template?: string | null;
  flags?: number;
  default_auto_archive_duration?: number;
};
type ThreadSummary = { id: string; name: string };
type Member = { roles: string[] };
type User = { id: string; username: string };

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
  attempt = 0,
): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return null;
  const text = await res.text();

  if (res.status === 429 && attempt < 8) {
    const parsed = JSON.parse(text) as { retry_after?: number };
    const waitMs = Math.ceil((parsed.retry_after ?? 1) * 1000) + 300;
    console.log(`  rate limited — wait ${Math.ceil(waitMs / 1000)}s`);
    await sleep(waitMs);
    return api<T>(method, path, body, attempt + 1);
  }

  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? (JSON.parse(text) as T) : null;
}

async function pause(): Promise<void> {
  await sleep(400);
}

// Plan §1 names (spaces OK in API create; Discord stores with "-")
const CUSTOM_ROLES = [
  { name: 'Owner', color: 0xed4245, hoist: true, mentionable: false },
  { name: 'Staff', color: 0x5865f2, hoist: true, mentionable: false },
  { name: 'NewGames', color: 0x57f287, hoist: true, mentionable: true },
  { name: 'Subscriber', color: 0xfee75c, hoist: false, mentionable: false },
  { name: 'Customer', color: 0x1abc9c, hoist: false, mentionable: false },
] as const;

const NEW_GAMES = '🎮 | new-games';

type Mode =
  | 'public-chat'
  | 'staff-post'
  | 'tickets'
  | 'staff-private'
  | 'category-public'
  | 'category-private';

type ChannelSpec = {
  name: string;
  type: 0 | 4 | 15;
  parent?: string;
  topic?: string;
  mode: Mode;
};

const LAYOUT: ChannelSpec[] = [
  { name: 'rules', type: 0, mode: 'staff-post', topic: 'Server rules — read before posting.' },

  { name: '{ INFO }', type: 4, mode: 'category-public' },
  { name: '📢 | announcements', type: 0, parent: '{ INFO }', mode: 'staff-post' },
  { name: NEW_GAMES, type: 0, parent: '{ INFO }', mode: 'staff-post' },
  { name: '♻️ | restored-games', type: 0, parent: '{ INFO }', mode: 'staff-post' },
  {
    name: '🌐 | website',
    type: 0,
    parent: '{ INFO }',
    mode: 'staff-post',
    topic: `Store: ${SITE_URL}`,
  },

  { name: '{ GUIDES }', type: 4, mode: 'category-public' },
  {
    name: '🔑 | how-to-activate',
    type: 0,
    parent: '{ GUIDES }',
    mode: 'staff-post',
    topic: `${SITE_URL}/my-games`,
  },
  {
    name: '🔵 | ubisoft-offline',
    type: 0,
    parent: '{ GUIDES }',
    mode: 'staff-post',
    topic: 'Ubisoft offline mode guide',
  },
  {
    name: '🎮 | steam-offline',
    type: 0,
    parent: '{ GUIDES }',
    mode: 'staff-post',
    topic: 'Steam offline + disable cloud saves',
  },

  { name: '{ HELP }', type: 4, mode: 'category-public' },
  {
    name: '❓ | general-help',
    type: 0,
    parent: '{ HELP }',
    mode: 'public-chat',
    topic: 'Ask questions here — staff and bot can help.',
  },
  {
    name: '📞 | contact',
    type: 0,
    parent: '{ HELP }',
    mode: 'staff-post',
    topic: `${SITE_URL}/contact`,
  },
  {
    name: '🎫 | tickets',
    type: 15,
    parent: '{ HELP }',
    mode: 'tickets',
    topic: 'Open a thread for private support.',
  },

  { name: '{ STAFF }', type: 4, mode: 'category-private' },
  {
    name: '🚨 | staff-alerts',
    type: 0,
    parent: '{ STAFF }',
    mode: 'staff-private',
    topic: 'Ops alerts (account health, etc.)',
  },
  {
    name: '📬 | owner-escalations',
    type: 0,
    parent: '{ STAFF }',
    mode: 'staff-private',
    topic: 'AI bot posts when it cannot solve a ticket.',
  },
];

const LAYOUT_NORMS = new Set(LAYOUT.map((c) => norm(c.name)));
const ROLE_NAMES = new Set(CUSTOM_ROLES.map((r) => r.name));

function isManagedChannel(ch: Channel): boolean {
  return LAYOUT_NORMS.has(norm(ch.name));
}

function overwrites(
  mode: Mode,
  ids: { everyone: string; owner: string; staff: string; bot: string },
): unknown[] {
  const read = bits(Perm.ViewChannel, Perm.ReadMessageHistory);
  const write = bits(Perm.ViewChannel, Perm.SendMessages, Perm.ReadMessageHistory);
  const ticket = bits(
    Perm.ViewChannel,
    Perm.ReadMessageHistory,
    Perm.CreatePublicThreads,
    Perm.SendMessagesInThreads,
  );

  switch (mode) {
    case 'category-public':
    case 'public-chat':
      return [{ id: ids.everyone, type: 0, allow: write, deny: '0' }];
    case 'staff-post':
      return [
        { id: ids.everyone, type: 0, allow: read, deny: bits(Perm.SendMessages) },
        { id: ids.staff, type: 0, allow: write, deny: '0' },
        { id: ids.bot, type: 0, allow: write, deny: '0' },
        { id: ids.owner, type: 0, allow: write, deny: '0' },
      ];
    case 'tickets':
      return [
        { id: ids.everyone, type: 0, allow: ticket, deny: bits(Perm.SendMessages) },
        { id: ids.staff, type: 0, allow: write, deny: '0' },
        { id: ids.bot, type: 0, allow: write, deny: '0' },
        { id: ids.owner, type: 0, allow: write, deny: '0' },
      ];
    case 'category-private':
    case 'staff-private':
      return [
        { id: ids.everyone, type: 0, deny: bits(Perm.ViewChannel), allow: '0' },
        { id: ids.owner, type: 0, allow: write, deny: '0' },
        { id: ids.staff, type: 0, allow: write, deny: '0' },
        { id: ids.bot, type: 0, allow: write, deny: '0' },
      ];
  }
}

async function wipeAll(channels: Channel[], roles: Role[]): Promise<void> {
  console.log('\nWipe — deleting ALL matching layout channels (including duplicates)');

  const managed = channels.filter(isManagedChannel);
  const children = managed.filter((c) => c.type !== 4);
  const categories = managed.filter((c) => c.type === 4);

  let failed = 0;
  for (const ch of [...children, ...categories]) {
    try {
      await api('DELETE', `/channels/${ch.id}`);
      console.log(`  deleted: ${ch.name} (${ch.id})`);
      await pause();
    } catch (err) {
      failed += 1;
      console.warn(`  FAILED delete: ${ch.name} — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\nWipe — deleting custom roles');
  for (const role of roles) {
    if (!ROLE_NAMES.has(role.name) || role.managed) continue;
    try {
      await api('DELETE', `/guilds/${GUILD_ID}/roles/${role.id}`);
      console.log(`  deleted role: ${role.name}`);
      await pause();
    } catch (err) {
      console.warn(`  FAILED role ${role.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (failed > 0) {
    throw new Error(
      `${failed} channel(s) could not be deleted (usually locked { STAFF }).\n` +
        '  In Discord: right-click "{ STAFF }" → Delete Category.\n' +
        '  Also delete any leftover duplicate channels you still see.\n' +
        '  Then run: pnpm discord:setup -- --wipe',
    );
  }
}

async function ensureRole(
  roles: Role[],
  spec: (typeof CUSTOM_ROLES)[number],
): Promise<Role> {
  const existing = roles.find((r) => r.name === spec.name);
  if (existing) {
    console.log(`  role exists: ${spec.name}`);
    return existing;
  }
  const created = await api<Role>('POST', `/guilds/${GUILD_ID}/roles`, {
    name: spec.name,
    color: spec.color,
    hoist: spec.hoist,
    mentionable: spec.mentionable,
  });
  if (!created) throw new Error(`Failed to create role ${spec.name}`);
  console.log(`  created role: ${spec.name}`);
  roles.push(created);
  await pause();
  return created;
}

function findChannel(
  channels: Channel[],
  spec: ChannelSpec,
  parentId: string | undefined,
): Channel | undefined {
  const matches = channels.filter(
    (c) => norm(c.name) === norm(spec.name) && c.type === spec.type,
  );
  if (parentId) {
    return matches.find((c) => c.parent_id === parentId) ?? matches[0];
  }
  return matches.find((c) => c.parent_id === null) ?? matches[0];
}

async function ensureChannel(
  channels: Channel[],
  spec: ChannelSpec,
  parentId: string | undefined,
  permission_overwrites: unknown[],
): Promise<Channel> {
  const existing = findChannel(channels, spec, parentId);
  if (existing) {
    console.log(`  exists: ${existing.name}`);
    return existing;
  }

  const created = await api<Channel>('POST', `/guilds/${GUILD_ID}/channels`, {
    name: spec.name,
    type: spec.type,
    parent_id: parentId ?? undefined,
    topic: spec.topic,
    permission_overwrites,
  });
  if (!created) throw new Error(`Failed to create ${spec.name}`);
  console.log(`  created: ${created.name}`);
  channels.push(created);
  await pause();
  return created;
}

async function ensureWebhook(channelId: string): Promise<{ url: string }> {
  const name = 'GameStore Publish';
  const existing =
    (await api<Array<{ name: string; url?: string }>>(
      'GET',
      `/channels/${channelId}/webhooks`,
    )) ?? [];
  const found = existing.find((w) => w.name === name && w.url);
  if (found?.url) {
    console.log('  webhook exists');
    return { url: found.url };
  }
  const created = await api<{ url: string }>('POST', `/channels/${channelId}/webhooks`, {
    name,
  });
  if (!created?.url) throw new Error('Failed to create webhook');
  console.log('  created webhook');
  return created;
}

async function createInvite(channelId: string): Promise<string> {
  const invite = await api<{ code: string }>('POST', `/channels/${channelId}/invites`, {
    max_age: 0,
    max_uses: 0,
    unique: true,
  });
  if (!invite?.code) throw new Error('Failed to create invite');
  return `https://discord.gg/${invite.code}`;
}

const THREAD_FLAG_PINNED = 1 << 1;

function normThreadTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function listForumThreads(channelId: string, guildId: string): Promise<ThreadSummary[]> {
  const guildActive =
    (await api<{ threads: ThreadSummary[] }>(
      'GET',
      `/guilds/${guildId}/threads/active`,
    )) ?? { threads: [] };
  const fromGuild = guildActive.threads.filter(
    (thread) => (thread as ThreadSummary & { parent_id?: string }).parent_id === channelId,
  );

  if (fromGuild.length > 0) {
    return fromGuild;
  }

  try {
    const active =
      (await api<{ threads: ThreadSummary[] }>(
        'GET',
        `/channels/${channelId}/threads/active`,
      )) ?? { threads: [] };
    return active.threads;
  } catch {
    return [];
  }
}

async function ensureTicketsWelcomePost(
  channelId: string,
  guildId: string,
  siteUrl: string,
): Promise<void> {
  const welcome = buildTicketsWelcomePost(siteUrl);
  const threads = await listForumThreads(channelId, guildId);
  const welcomeNorm = normThreadTitle(welcome.title);
  const exists = threads.some((thread) => {
    const name = normThreadTitle(thread.name);
    return name === welcomeNorm || name.includes('read first');
  });

  if (exists) {
    console.log('  welcome post already exists');
    return;
  }

  const thread = await api<{ id: string }>('POST', `/channels/${channelId}/threads`, {
    name: welcome.title,
    auto_archive_duration: 10080,
    message: { content: welcome.content },
  });
  if (!thread?.id) {
    throw new Error('Failed to create tickets welcome forum post');
  }
  console.log(`  created welcome post: ${welcome.title}`);
  await pause();

  try {
    await api('PATCH', `/channels/${thread.id}`, { flags: THREAD_FLAG_PINNED });
    console.log('  pinned welcome post');
    await pause();
  } catch {
    console.warn('  could not pin welcome post (optional)');
  }
}

async function tryPatchForum(
  channelId: string,
  patch: Record<string, unknown>,
  label: string,
): Promise<boolean> {
  try {
    await api('PATCH', `/channels/${channelId}`, patch);
    console.log(`  set ${label}`);
    await pause();
    return true;
  } catch (err) {
    console.warn(
      `  skipped ${label}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

async function configureTicketsForum(channelId: string, siteUrl: string): Promise<void> {
  console.log('\nTickets forum (tags, reaction, guidelines, welcome post)');

  const channel = await api<ForumChannel>('GET', `/channels/${channelId}`);
  if (!channel) {
    throw new Error('Failed to read tickets forum channel');
  }

  const guidelines = buildTicketsForumPostGuidelines(siteUrl);
  let configured = 0;

  if (!forumTagsMatch(channel.available_tags, TICKETS_FORUM_TAGS)) {
    if (
      await tryPatchForum(channelId, {
        available_tags: TICKETS_FORUM_TAGS.map((tag) => ({ ...tag })),
      }, 'tags')
    ) {
      configured += 1;
    }
  } else {
    console.log('  tags already configured');
  }

  if (channel.default_reaction_emoji?.emoji_name !== TICKETS_FORUM_DEFAULT_REACTION.emoji_name) {
    if (
      await tryPatchForum(
        channelId,
        { default_reaction_emoji: { ...TICKETS_FORUM_DEFAULT_REACTION } },
        'default reaction',
      )
    ) {
      configured += 1;
    }
  } else {
    console.log('  default reaction already configured');
  }

  if (!(channel.template ?? '').includes('Pick a tag')) {
    const set = await tryPatchForum(channelId, { template: guidelines }, 'post guidelines');
    if (!set) {
      console.warn(
        '  manual step: open 🎫 | tickets → Get Started → Create post guidelines and paste:',
      );
      console.warn(`    ${guidelines}`);
    } else {
      configured += 1;
    }
  } else {
    console.log('  post guidelines already configured');
  }

  if (channel.default_auto_archive_duration !== 10080) {
    if (
      await tryPatchForum(
        channelId,
        { default_auto_archive_duration: 10080 },
        'auto-archive duration',
      )
    ) {
      configured += 1;
    }
  }

  if (configured === 0) {
    console.log('  forum metadata already up to date');
  }

  try {
    await ensureTicketsWelcomePost(channelId, GUILD_ID, siteUrl);
  } catch (err) {
    console.warn(
      `  skipped welcome post: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function main(): Promise<void> {
  console.log('Discord D.0 setup');
  console.log(`  guild: ${GUILD_ID}`);
  console.log(`  wipe:  ${WIPE}`);

  const me = await api<User>('GET', '/users/@me');
  if (!me) throw new Error('Invalid DISCORD_BOT_TOKEN');
  console.log(`  bot:   ${me.username}`);

  const member = await api<Member>('GET', `/guilds/${GUILD_ID}/members/${me.id}`);
  if (!member) throw new Error('Bot is not in this server');

  let roles = (await api<Role[]>('GET', `/guilds/${GUILD_ID}/roles`)) ?? [];
  let channels = (await api<Channel[]>('GET', `/guilds/${GUILD_ID}/channels`)) ?? [];

  const botRole =
    roles.find((r) => r.managed && member.roles.includes(r.id)) ??
    roles
      .filter((r) => member.roles.includes(r.id))
      .sort((a, b) => b.position - a.position)[0];
  if (!botRole) throw new Error('Could not resolve bot APP role');

  const rank =
    [...roles].sort((a, b) => b.position - a.position).findIndex((r) => r.id === botRole.id) + 1;
  console.log(`  bot role rank: ${rank}/${roles.length}`);
  if (rank > 2) {
    console.warn('  WARNING: Drag Offline Gamenia to TOP of Roles, then re-run.');
  }

  // Always list duplicates so you can see the mess
  const dupes = channels.filter(isManagedChannel);
  console.log(`\n  managed channels currently: ${dupes.length}`);
  for (const ch of dupes) {
    console.log(`    - ${ch.name} (parent=${ch.parent_id ?? 'none'})`);
  }

  if (WIPE) {
    await wipeAll(channels, roles);
    roles = (await api<Role[]>('GET', `/guilds/${GUILD_ID}/roles`)) ?? [];
    channels = (await api<Channel[]>('GET', `/guilds/${GUILD_ID}/channels`)) ?? [];
    const leftover = channels.filter(isManagedChannel);
    if (leftover.length > 0) {
      throw new Error(
        `Wipe incomplete — ${leftover.length} channel(s) remain. Delete them in Discord UI, then re-run --wipe.`,
      );
    }
  }

  console.log('\nRoles');
  const roleIds: Record<string, string> = {};
  for (const spec of CUSTOM_ROLES) {
    roleIds[spec.name] = (await ensureRole(roles, spec)).id;
  }

  const ids = {
    everyone: GUILD_ID,
    owner: roleIds.Owner,
    staff: roleIds.Staff,
    bot: botRole.id,
  };

  console.log('\nChannels');
  const byKey = new Map<string, Channel>();

  for (const spec of LAYOUT) {
    const parentId = spec.parent ? byKey.get(norm(spec.parent))?.id : undefined;
    if (spec.parent && !parentId) {
      throw new Error(`Parent missing: ${spec.parent}`);
    }
    const ch = await ensureChannel(channels, spec, parentId, overwrites(spec.mode, ids));
    byKey.set(norm(spec.name), ch);
  }

  const newGames = byKey.get(norm(NEW_GAMES));
  if (!newGames) throw new Error(`Missing ${NEW_GAMES}`);

  const ticketsForum = byKey.get(norm('🎫 | tickets'));

  if (ticketsForum) {
    await configureTicketsForum(ticketsForum.id, SITE_URL);
  }

  console.log('\nWebhook + invite');
  const webhook = await ensureWebhook(newGames.id);
  await pause();
  const inviteUrl = await createInvite(newGames.id);

  console.log('\n========== Add these to .env ==========');
  console.log(`NEXT_PUBLIC_DISCORD_INVITE_URL=${inviteUrl}`);
  console.log(`DISCORD_NEW_GAMES_WEBHOOK_URL=${webhook.url}`);
  console.log(`DISCORD_NEW_GAMES_ROLE_ID=${roleIds.NewGames}`);
  if (ticketsForum) {
    console.log(`DISCORD_TICKETS_CHANNEL_ID=${ticketsForum.id}`);
  }
  console.log('=======================================');
  console.log('\nDone. Assign yourself Owner, then say "done" for D.1.');
}

main().catch((err: unknown) => {
  console.error('\nFAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
