import type { Client, ForumChannel, ThreadChannel } from 'discord.js';
import type { ConversationTurn } from '../ai/conversation-memory';
import { findChannelByName } from '../escalate';
import { TICKET_TEMPLATE, ticketChannelMention } from '../knowledge/links';

const TICKET_DEDUPE_MS = 30 * 60 * 1000;
const recentTicketsByUser = new Map<string, { threadId: string; at: number }>();

export function resetTicketDedupe(): void {
  recentTicketsByUser.clear();
}

export function shouldSkipTicketCreate(userId: string): { skip: boolean; threadId?: string } {
  const entry = recentTicketsByUser.get(userId);
  if (!entry) return { skip: false };
  if (Date.now() - entry.at > TICKET_DEDUPE_MS) {
    recentTicketsByUser.delete(userId);
    return { skip: false };
  }
  return { skip: true, threadId: entry.threadId };
}

export function recordTicketCreated(userId: string, threadId: string): void {
  recentTicketsByUser.set(userId, { threadId, at: Date.now() });
}

export function sanitizeThreadName(username: string): string {
  const safe = username.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
  const name = `support-${safe}`.slice(0, 95);
  return name.length >= 2 ? name : 'support-ticket';
}

export type TicketBodyInput = {
  userId: string;
  userTag: string;
  question: string;
  reason?: string;
  history?: ConversationTurn[];
  ticketsChannelMention?: string;
};

export function buildTicketThreadBody(input: TicketBodyInput): string {
  const mention = input.ticketsChannelMention ?? ticketChannelMention();
  const staffRoleId = process.env['DISCORD_STAFF_ROLE_ID']?.trim();
  const staffPing = staffRoleId ? `<@&${staffRoleId}> ` : '';

  const historyBlock =
    input.history && input.history.length > 0
      ? input.history
          .slice(-4)
          .map((t) => `**${t.role === 'user' ? 'User' : 'Bot'}:** ${t.content.slice(0, 400)}`)
          .join('\n')
      : '';

  return [
    staffPing + `**Support ticket** for <@${input.userId}> (\`${input.userTag}\`)`,
    input.reason ? `**Reason:** ${input.reason}` : '',
    '**Latest message:**',
    `>>> ${input.question.slice(0, 1200)}`,
    historyBlock ? `**Recent chat:**\n${historyBlock}` : '',
    '',
    TICKET_TEMPLATE,
    '',
    `_Opened from ${mention}. Staff: reply in this thread. Never ask for passwords in public channels._`,
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1900);
}

export function formatTicketOpenedReply(threadUrl: string, existing = false): string {
  if (existing) {
    return `\n\nYou already have an open ticket — continue here: ${threadUrl}`;
  }
  return `\n\n**Opened your private ticket:** ${threadUrl}\nStaff will reply in that thread.`;
}

export async function resolveTicketsForum(
  client: Client,
  guildId: string,
): Promise<ForumChannel | null> {
  const envId = process.env['DISCORD_TICKETS_CHANNEL_ID']?.trim();
  if (envId) {
    try {
      const ch = await client.channels.fetch(envId);
      if (ch?.isThreadOnly()) return ch as ForumChannel;
    } catch {
      console.warn('[ticket] DISCORD_TICKETS_CHANNEL_ID invalid, falling back to name lookup');
    }
  }

  const byName = await findChannelByName(client, guildId, '🎫 | tickets');
  if (byName?.isThreadOnly()) return byName as ForumChannel;
  return null;
}

export type CreateTicketResult =
  | { ok: true; thread: ThreadChannel; url: string; reused: boolean }
  | { ok: false; reason: string };

export async function createSupportTicket(
  client: Client,
  guildId: string,
  input: TicketBodyInput,
): Promise<CreateTicketResult> {
  const dedupe = shouldSkipTicketCreate(input.userId);
  if (dedupe.skip && dedupe.threadId) {
    try {
      const existing = await client.channels.fetch(dedupe.threadId);
      if (existing?.isThread()) {
        return {
          ok: true,
          thread: existing,
          url: existing.url,
          reused: true,
        };
      }
    } catch {
      recentTicketsByUser.delete(input.userId);
    }
  }

  const forum = await resolveTicketsForum(client, guildId);
  if (!forum) {
    return { ok: false, reason: 'Tickets forum channel not found' };
  }

  const threadName = sanitizeThreadName(input.userTag);
  const body = buildTicketThreadBody(input);

  try {
    const thread = await forum.threads.create({
      name: threadName,
      message: { content: body },
      reason: `Support ticket for ${input.userTag}`,
    });

    recordTicketCreated(input.userId, thread.id);

    return {
      ok: true,
      thread,
      url: thread.url,
      reused: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ticket] create failed:', msg);
    return { ok: false, reason: msg };
  }
}
