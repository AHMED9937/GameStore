import type { Client, Message, TextChannel } from 'discord.js';
import type { SupportDecision } from './safety';

function norm(name: string): string {
  return name.toLowerCase().replace(/[\s\-_|｜]+/g, '');
}

const recentEscalations = new Map<string, number>();
const DEDUPE_MS = 10 * 60 * 1000;

function escalationKey(userId: string, reason: string | undefined): string {
  return `${userId}:${(reason || 'unknown').slice(0, 40)}`;
}

export function shouldSkipEscalation(userId: string, reason: string | undefined): boolean {
  const key = escalationKey(userId, reason);
  const last = recentEscalations.get(key) ?? 0;
  if (Date.now() - last < DEDUPE_MS) return true;
  recentEscalations.set(key, Date.now());
  return false;
}

/** Test helper */
export function resetEscalationDedupe(): void {
  recentEscalations.clear();
}

export async function findChannelByName(
  client: Client,
  guildId: string,
  displayName: string,
): Promise<TextChannel | null> {
  const guild = await client.guilds.fetch(guildId);
  const channels = await guild.channels.fetch();
  const target = norm(displayName);
  const found = channels.find(
    (ch) =>
      ch &&
      'name' in ch &&
      norm(ch.name) === target &&
      (ch.isTextBased() || ('isThreadOnly' in ch && ch.isThreadOnly())),
  );
  return (found as TextChannel | undefined) ?? null;
}

export type EscalationMeta = Pick<
  SupportDecision,
  'intent' | 'confidence' | 'retrievedDocIds' | 'reason'
>;

export async function escalateToOwner(
  client: Client,
  source: Message,
  question: string,
  reason: string | undefined,
  meta?: EscalationMeta,
): Promise<boolean> {
  if (shouldSkipEscalation(source.author.id, reason)) {
    console.log('[escalate] deduped for user', source.author.id);
    return false;
  }

  const ownerId = process.env['DISCORD_OWNER_USER_ID']?.trim();
  const guildId = process.env['DISCORD_GUILD_ID']?.trim();
  const staffRoleId = process.env['DISCORD_STAFF_ROLE_ID']?.trim();

  const staffAction = suggestStaffAction(meta?.intent, reason);

  const summary = [
    `**Support escalation**`,
    `From: <@${source.author.id}> (\`${source.author.tag}\`)`,
    `Channel: <#${source.channel.id}>`,
    `Reason: ${reason || 'unresolved'}`,
    meta?.intent ? `Intent: \`${meta.intent}\`` : '',
    meta?.confidence !== undefined ? `Confidence: ${meta.confidence.toFixed(2)}` : '',
    meta?.retrievedDocIds?.length
      ? `Docs: ${meta.retrievedDocIds.join(', ')}`
      : '',
    staffAction ? `Suggested action: ${staffAction}` : '',
    `Question:`,
    `>>> ${question.slice(0, 1500)}`,
    source.url ? `Jump: ${source.url}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const ping =
    staffRoleId && isCriticalIntent(meta?.intent)
      ? `<@&${staffRoleId}> `
      : '';

  if (ownerId) {
    try {
      const user = await client.users.fetch(ownerId);
      await user.send(summary);
    } catch (err) {
      console.warn(
        '[escalate] Could not DM owner (DMs closed?):',
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    console.warn('[escalate] DISCORD_OWNER_USER_ID not set');
  }

  if (guildId) {
    const channel = await findChannelByName(
      client,
      guildId,
      '📬 | owner-escalations',
    );
    if (channel) {
      await channel.send({ content: ping + summary, allowedMentions: { roles: staffRoleId ? [staffRoleId] : [] } });
    }
  }

  return true;
}

function isCriticalIntent(intent: string | undefined): boolean {
  return (
    intent === 'refund-dispute' ||
    intent === 'fraud-legal' ||
    intent === 'pasted-license-key' ||
    intent === 'human-request'
  );
}

function suggestStaffAction(intent: string | undefined, reason: string | undefined): string {
  switch (intent) {
    case 'payment-no-license':
      return 'Look up Stripe order by email; resend license if paid.';
    case 'wrong-credentials':
      return 'Verify account pool health; swap account if needed.';
    case 'refund-dispute':
      return 'Review order + refund policy.';
    case 'pasted-license-key':
      return 'Remind user not to post keys; rotate if compromised.';
    default:
      return reason?.includes('No FAQ') ? 'Manual FAQ answer or update bot knowledge.' : 'Review thread and reply in tickets.';
  }
}
