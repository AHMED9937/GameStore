import {
  REST,
  Routes,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Client,
} from 'discord.js';
import { ticketGuidanceReply } from './ai/intent-router';
import { formatDocReply, getDocById } from './knowledge/faq-pack';
import { retrieveKnowledge } from './knowledge/retrieve';
import { getSiteUrl, siteLink, SITE_PATHS, ticketOpenHint } from './knowledge/links';

const FAQ_TOPICS = [
  { name: 'activate', value: 'how-to-activate' },
  { name: 'steam-offline', value: 'steam-offline' },
  { name: 'ubisoft-offline', value: 'ubisoft-offline' },
  { name: 'saves', value: 'personal-saves' },
  { name: 'license', value: 'lost-license' },
  { name: 'guard', value: 'steam-guard-location' },
  { name: 'cooldown', value: 'steam-guard-cooldown' },
] as const;

export const slashCommands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('GameStore support menu — links and channels'),
  new SlashCommandBuilder()
    .setName('faq')
    .setDescription('FAQ answer for a common topic')
    .addStringOption((opt) =>
      opt
        .setName('topic')
        .setDescription('FAQ topic')
        .setRequired(true)
        .addChoices(...FAQ_TOPICS.map((t) => ({ name: t.name, value: t.value }))),
    ),
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('What to include when opening a support ticket'),
].map((c) => c.toJSON());

export async function registerSlashCommands(
  client: Client,
  guildId: string,
): Promise<void> {
  const token = process.env['DISCORD_BOT_TOKEN']?.trim();
  const appId = client.application?.id;
  if (!token || !appId) {
    console.warn('[slash] missing token or application id');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(appId, guildId), {
    body: slashCommands,
  });
  console.log('[slash] registered guild commands');
}

export function helpMenuReply(): string {
  const site = getSiteUrl();
  return [
    '**Offline Gamenia support**',
    `• **My Games / activate:** ${siteLink(SITE_PATHS.myGames)}`,
    `• **FAQ:** ${siteLink(SITE_PATHS.faq)}`,
    `• **Shop:** ${siteLink(SITE_PATHS.shop)}`,
    `• **Subscriptions:** ${siteLink(SITE_PATHS.subscriptions)}`,
    `• **Discord:** ask in ❓ | general-help or ${ticketOpenHint()}`,
    '• **Commands:** `/faq topic:…` `/ticket`',
    '',
    `_Site: ${site}_`,
  ].join('\n');
}

export async function handleSlashCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const name = interaction.commandName;

  if (name === 'help') {
    await interaction.reply({
      content: helpMenuReply(),
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (name === 'ticket') {
    await interaction.reply({
      content: ticketGuidanceReply(),
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (name === 'faq') {
    const topic = interaction.options.getString('topic', true);
    const doc = getDocById(topic);
    if (doc) {
      await interaction.reply({
        content: formatDocReply(doc).slice(0, 1900),
        allowedMentions: { parse: [] },
      });
      return;
    }

    const query = interaction.options.getString('topic') ?? '';
    const retrieved = retrieveKnowledge(query, 1)[0];
    await interaction.reply({
      content: retrieved
        ? formatDocReply(retrieved).slice(0, 1900)
        : `No FAQ match. See ${siteLink(SITE_PATHS.faq)}`,
      allowedMentions: { parse: [] },
    });
  }
}

export const TICKET_THREAD_WELCOME = [
  'Thanks for opening a ticket.',
  ticketGuidanceReply(),
  '',
  `A staff member or the support bot will reply here. ${ticketOpenHint()}`,
  '**Never post passwords or Steam Guard codes.**',
].join('\n');

export const HELP_CHANNEL_STICKY = [
  '**Support bot** — mention me or ask a question about activation, offline play, or licenses.',
  '• `/help` — quick links',
  '• `/faq` — common answers',
  '• `/ticket` — what to include in a ticket',
  '• Credentials & 2FA are **only** on the website My Games page.',
].join('\n');
