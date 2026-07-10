import {

  Client,

  GatewayIntentBits,

  Partials,

  type Message,

} from 'discord.js';

import { readFileSync } from 'node:fs';

import { resolve } from 'node:path';

import { answerSupportQuestion, geminiPausedUntilIso, isGeminiQuotaPaused } from './ai/support-agent';

import { appendTurn, clearSession, getHistory } from './ai/conversation-memory';

import { logMetrics } from './ai/metrics';

import { escalateToOwner, findChannelByName } from './escalate';

import {

  isLocalSiteUrl,

  setTicketsChannelId,

  ticketChannelMention,

  ticketOpenHint,

} from './knowledge/links';

import {

  isEmbedOnlyMessage,

  isMessageTooLong,

} from './safety';

import {
  handleSlashCommand,
  HELP_CHANNEL_STICKY,
  registerSlashCommands,
  TICKET_THREAD_WELCOME,
} from './slash-commands';

import {
  createSupportTicket,
  formatTicketOpenedReply,
  resolveTicketsForum,
} from './tickets/ticket-service';

import { looksStillStuck } from './tickets/stuck-detection';



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

    console.error(`Missing ${name}`);

    process.exit(1);

  }

  return value;

}



const TOKEN = requireEnv('DISCORD_BOT_TOKEN');

const GUILD_ID = requireEnv('DISCORD_GUILD_ID');



const HELP_NAMES = ['❓ | general-help', 'general-help'];

const RATE_LIMIT_MS = 15_000;

const recentByUser = new Map<string, number>();



function norm(name: string): string {

  return name.toLowerCase().replace(/[\s\-_|｜]+/g, '');

}



function isHelpChannel(channelName: string | undefined): boolean {

  if (!channelName) return false;

  const n = norm(channelName);

  return HELP_NAMES.some((h) => norm(h) === n) || n.includes('generalhelp');

}



function isTicketsForum(channelName: string | undefined): boolean {

  if (!channelName) return false;

  return norm(channelName).includes('tickets');

}



function isRateLimited(userId: string): boolean {

  const now = Date.now();

  const last = recentByUser.get(userId) ?? 0;

  if (now - last < RATE_LIMIT_MS) return true;

  recentByUser.set(userId, now);

  return false;

}



function looksLikeSupportMessage(content: string, mentioned: boolean): boolean {

  if (mentioned) return true;

  if (looksStillStuck(content)) return true;

  const trimmed = content.trim();

  if (!trimmed) return false;

  return (

    trimmed.includes('?') ||

    /^(how|why|where|what|help|i |my |cant|can't|cannot|doesnt|doesn't|not working|error|help me)/i.test(

      trimmed,

    )

  );

}



function auditLog(event: string, data: Record<string, unknown>): void {

  console.log(

    JSON.stringify({

      ts: new Date().toISOString(),

      event,

      ...data,

    }),

  );

}



async function handleMessage(client: Client, message: Message): Promise<void> {

  if (message.author.bot) return;

  if (!message.guild || message.guild.id !== GUILD_ID) return;



  const channel = message.channel;

  if (!('name' in channel) || typeof channel.name !== 'string') return;



  const inHelp = isHelpChannel(channel.name);

  const inTicketThread =

    channel.isThread() &&

    channel.parent &&

    'name' in channel.parent &&

    isTicketsForum(String(channel.parent.name));



  if (!inHelp && !inTicketThread) return;

  if (message.mentions.everyone) return;



  if (isEmbedOnlyMessage(message.content, message.embeds.length > 0)) return;

  if (isMessageTooLong(message.content)) {

    await message.reply('Message too long — please shorten and try again.');

    return;

  }



  const botId = client.user?.id;

  const mentioned =

    botId !== undefined && message.mentions.users.has(botId);



  if (inHelp && !looksLikeSupportMessage(message.content, mentioned)) return;



  if (isRateLimited(message.author.id)) {

    await message.reply('Please wait a few seconds before asking again.');

    return;

  }



  await channel.sendTyping();



  const channelId = message.channel.id;

  appendTurn(channelId, { role: 'user', content: message.content });



  const decision = await answerSupportQuestion(message.content, {

    channelId,

    userId: message.author.id,

  });



  let replyText = decision.reply.slice(0, 1700);



  if (decision.openTicket) {

    const ticketResult = await createSupportTicket(client, GUILD_ID, {

      userId: message.author.id,

      userTag: message.author.tag,

      question: message.content,

      reason: decision.ticketReason ?? decision.reason,

      history: getHistory(channelId),

      ticketsChannelMention: ticketChannelMention(),

    });



    if (ticketResult.ok) {

      replyText += formatTicketOpenedReply(ticketResult.url, ticketResult.reused);

      auditLog('ticket_opened', {

        userId: message.author.id,

        threadId: ticketResult.thread.id,

        reused: ticketResult.reused,

      });

    } else {

      replyText += `\n\n_Could not auto-open a ticket (${ticketResult.reason}). ${ticketOpenHint()}_`;

    }

  } else if (decision.escalate && decision.suggestTicket) {

    replyText += `\n\n_${ticketOpenHint()}_`;

  } else if (decision.escalate) {

    replyText += '\n\n_Staff have been notified._';

  }



  await message.reply({

    content: replyText.slice(0, 1900),

    allowedMentions: { repliedUser: true, parse: [] },

  });



  appendTurn(channelId, { role: 'assistant', content: decision.reply });



  auditLog('support_reply', {

    userId: message.author.id,

    channelId,

    intent: decision.intent,

    escalate: decision.escalate,

    openTicket: decision.openTicket,

    confidence: decision.confidence,

  });



  if (decision.escalate) {

    const sent = await escalateToOwner(

      client,

      message,

      message.content,

      decision.reason,

      {

        intent: decision.intent,

        confidence: decision.confidence,

        retrievedDocIds: decision.retrievedDocIds,

        reason: decision.reason,

      },

    );

    if (sent) clearSession(channelId);

  }

}



async function maybePostHelpSticky(client: Client): Promise<void> {

  if (process.env['DISCORD_POST_HELP_STICKY'] !== 'true') return;

  const help = await findChannelByName(client, GUILD_ID, '❓ | general-help');

  if (!help) return;

  await help.send(HELP_CHANNEL_STICKY);

}



async function main(): Promise<void> {

  const client = new Client({

    intents: [

      GatewayIntentBits.Guilds,

      GatewayIntentBits.GuildMessages,

      GatewayIntentBits.MessageContent,

      GatewayIntentBits.DirectMessages,

    ],

    partials: [Partials.Channel],

  });



  client.once('clientReady', async () => {

    console.log(`Discord support bot ready as ${client.user?.tag}`);

    console.log(`  guild: ${GUILD_ID}`);

    console.log(

      `  Gemini: ${process.env['GEMINI_API_KEY'] ? (isGeminiQuotaPaused() ? `quota paused until ${geminiPausedUntilIso()}` : 'enabled (primary brain)') : 'off — FAQ fallback only'}`,

    );

    console.log(

      `  model: ${process.env['GEMINI_MODEL']?.trim() || 'gemini-2.0-flash'}`,

    );

    console.log(

      `  owner: ${process.env['DISCORD_OWNER_USER_ID'] ? 'set' : 'MISSING — escalations will only post to channel'}`,

    );



    if (isLocalSiteUrl()) {

      console.warn(

        '  warning: NEXT_PUBLIC_SITE_URL is localhost — Discord users will get broken website links',

      );

    }



    const ticketsForum = await resolveTicketsForum(client, GUILD_ID);

    if (ticketsForum) {

      setTicketsChannelId(ticketsForum.id);

      console.log(`  tickets forum: ${ticketsForum.name} (${ticketsForum.id})`);

    } else {

      console.warn('  warning: could not resolve tickets forum channel');

    }



    await registerSlashCommands(client, GUILD_ID);

    await maybePostHelpSticky(client);



    const help = await findChannelByName(client, GUILD_ID, '❓ | general-help');

    if (!help) {

      console.warn('  warning: could not find ❓ | general-help channel');

    }



    setInterval(() => logMetrics(), 60 * 60 * 1000);

  });



  client.on('interactionCreate', (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.guildId !== GUILD_ID) return;

    void handleSlashCommand(interaction).catch((err) => {

      console.error('[interaction]', err instanceof Error ? err.message : err);

    });

  });



  client.on('threadCreate', (thread) => {
    void (async () => {
      if (!thread.parent || !('name' in thread.parent)) return;
      if (!isTicketsForum(String(thread.parent.name))) return;
      if (thread.ownerId === client.user?.id) return;
      try {
        await thread.send(TICKET_THREAD_WELCOME);
      } catch (err) {
        console.warn('[threadCreate]', err instanceof Error ? err.message : err);
      }
    })();
  });

  client.on('messageCreate', (message) => {

    void handleMessage(client, message).catch((err) => {

      console.error('[messageCreate]', err instanceof Error ? err.message : err);

    });

  });



  await client.login(TOKEN);

}



main().catch((err) => {

  console.error(err instanceof Error ? err.message : err);

  process.exit(1);

});


