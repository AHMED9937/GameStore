import {
  isGeminiQuotaError,
  markGeminiQuotaExceeded,
} from './gemini-quota';
import { getHistory } from './conversation-memory';
import type { IntentId } from './intent-router';
import { knowledgeAsPromptBlock } from '../knowledge/faq-pack';
import type { KnowledgeDoc } from '../knowledge/types';
import { linkMapPromptBlock } from '../knowledge/intent-links';
import {
  DISCORD_CHANNELS,
  getSiteUrl,
  siteLink,
  SITE_PATHS,
} from '../knowledge/links';
import {
  LOW_CONFIDENCE_THRESHOLD,
  sanitizeReply,
  shouldForceEscalate,
  type SupportDecision,
} from '../safety';

const SITE_URL = getSiteUrl();

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: {
      type: 'STRING',
      description: 'Discord markdown reply to the user, under 220 words',
    },
    escalate: {
      type: 'BOOLEAN',
      description: 'True if staff must handle this (refund, payment issue, unsure)',
    },
    confidence: {
      type: 'NUMBER',
      description: '0.0-1.0 how confident the answer is grounded in CONTEXT',
    },
    intent: {
      type: 'STRING',
      description: 'Short intent id e.g. steam-offline, lost-license',
    },
    reason: {
      type: 'STRING',
      description: 'Internal reason if escalating or low confidence',
    },
    suggestTicket: {
      type: 'BOOLEAN',
      description: 'True if user should open a ticket thread',
    },
  },
  required: ['reply', 'escalate', 'confidence'],
};

function buildSystemPrompt(docs: readonly KnowledgeDoc[]): string {
  const contextBlock =
    docs.length > 0
      ? knowledgeAsPromptBlock(docs)
      : 'No close FAQ match — use general navigation only or escalate.';

  return [
    '# Role',
    'You are **Offline Gamenia** support on Discord — friendly, clear, and accurate.',
    'You help players activate games, play offline (Steam/Ubisoft), recover licenses, and understand subscriptions.',
    '',
    '# Rules (never break)',
    '- Answer ONLY from CONTEXT below + store navigation. Do not invent keys, passwords, Steam Guard codes, or account details.',
    '- Credentials and 2FA codes are **only** on the website My Games page — never offer to post them in Discord.',
    '- Never send users to /faq for activation, credentials, or Steam Guard — use /my-games instead.',
    '- For refunds, chargebacks, fraud, or payment disputes: set escalate=true and suggestTicket=true.',
    '- If CONTEXT does not cover the question, set confidence below 0.5 and escalate=true.',
    '- Use Discord markdown: **bold**, bullet lists, numbered steps when helpful.',
    '- Include relevant links from the link map when they help the user.',
    '',
    '# Link map',
    `- My Games / activate: ${siteLink(SITE_PATHS.myGames)}`,
    `- FAQ: ${siteLink(SITE_PATHS.faq)}`,
    `- Shop: ${siteLink(SITE_PATHS.shop)}`,
    `- License recovery: ${siteLink(SITE_PATHS.licenseRecovery)}`,
    `- Subscriptions: ${siteLink(SITE_PATHS.subscriptions)}`,
    `- Discord guides: ${DISCORD_CHANNELS.howToActivate}, ${DISCORD_CHANNELS.steamOffline}, ${DISCORD_CHANNELS.ubisoftOffline}`,
    `- Tickets: ${DISCORD_CHANNELS.tickets}`,
    '',
    '# How to answer well',
    '1. Read CONVERSATION HISTORY — follow-ups like "that didn\'t work" refer to the previous topic.',
    '2. Synthesize across multiple CONTEXT sections if needed (e.g. activation + offline + saves).',
    '3. Give concrete next steps, not generic "contact support" unless escalating.',
    '4. For ambiguous issues, answer the most likely case and mention the alternative briefly.',
    '5. Tone: helpful gamer support, not corporate legalese.',
    '',
    '# Confidence guide',
    '- 0.9+ : exact match in CONTEXT',
    '- 0.7-0.9 : strong inference from CONTEXT',
    '- 0.55-0.7 : partial match, answer with caveats',
    '- below 0.55 : escalate=true',
    '',
    '# Examples (style only — do not copy facts blindly)',
    'User: "cant login to steam"',
    'Good: numbered steps → My Games → sign in on website → copy credentials → Steam offline mode; if still broken, open ticket with email + game name (no passwords in Discord).',
    '',
    'User: "that didnt work" (after Ubisoft offline)',
    'Good: acknowledge prior topic → try Method 2 firewall block → link FAQ → disable cloud saves → ticket if account-specific.',
    '',
    `# Store base URL: ${SITE_URL}`,
    '',
    '# Intent link routes (use primary link for each topic)',
    linkMapPromptBlock(),
    '',
    '# CONTEXT (ground truth)',
    contextBlock,
  ].join('\n');
}

type GeminiContent = {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
};

function buildContents(
  channelId: string | undefined,
  question: string,
  hints: string[],
): GeminiContent[] {
  const contents: GeminiContent[] = [];

  if (channelId) {
    const history = getHistory(channelId);
    // Exclude the current user message (already appended in main before call)
    const prior = history.slice(0, -1);
    for (const turn of prior) {
      contents.push({
        role: turn.role === 'user' ? 'user' : 'model',
        parts: [{ text: turn.content }],
      });
    }
  }

  const hintBlock =
    hints.length > 0 ? `\n\n[System hints: ${hints.join(' | ')}]` : '';

  contents.push({
    role: 'user',
    parts: [{ text: question + hintBlock }],
  });

  return contents;
}

function extractJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return {};
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

export type GeminiRequestContext = {
  channelId?: string;
  intentHint?: IntentId | null;
  forceEscalate?: boolean;
  retrievedDocs: KnowledgeDoc[];
};

export async function callGeminiSupport(
  question: string,
  ctx: GeminiRequestContext,
): Promise<SupportDecision> {
  const apiKey = process.env['GEMINI_API_KEY']?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const model = process.env['GEMINI_MODEL']?.trim() || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const hints: string[] = [];
  if (ctx.intentHint) hints.push(`likely intent: ${ctx.intentHint}`);
  if (ctx.forceEscalate || shouldForceEscalate(question)) {
    hints.push('MUST set escalate=true — sensitive topic (refund/payment/dispute/fraud)');
  }
  if (ctx.retrievedDocs.length === 0) {
    hints.push('no strong FAQ match — be cautious, prefer escalate if unsure');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(ctx.retrievedDocs) }],
      },
      contents: buildContents(ctx.channelId, question, hints),
      generationConfig: {
        temperature: 0.35,
        topP: 0.9,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 429) {
      markGeminiQuotaExceeded();
    }
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const parsed = extractJsonObject(raw);

  const confidence =
    typeof parsed['confidence'] === 'number'
      ? Math.max(0, Math.min(1, parsed['confidence']))
      : 0.65;

  const forceEsc =
    ctx.forceEscalate ||
    shouldForceEscalate(question) ||
    confidence < LOW_CONFIDENCE_THRESHOLD;

  const escalate = Boolean(parsed['escalate']) || forceEsc;

  const links = ctx.retrievedDocs
    .filter((d) => d.sitePath)
    .map((d) => siteLink(d.sitePath!))
    .slice(0, 3);

  return {
    reply: sanitizeReply(
      typeof parsed['reply'] === 'string' && parsed['reply'].trim()
        ? parsed['reply'].trim()
        : 'Sorry, I could not form an answer. Please open 🎫 | tickets or check the FAQ on the website.',
    ),
    escalate,
    confidence,
    intent:
      typeof parsed['intent'] === 'string'
        ? parsed['intent']
        : ctx.intentHint ?? ctx.retrievedDocs[0]?.id,
    reason:
      typeof parsed['reason'] === 'string'
        ? parsed['reason']
        : forceEsc
          ? 'Escalation required'
          : undefined,
    suggestTicket: Boolean(parsed['suggestTicket']) || escalate,
    links,
    retrievedDocIds: ctx.retrievedDocs.map((d) => d.id),
  };
}

export function isGeminiEnabled(): boolean {
  return Boolean(process.env['GEMINI_API_KEY']?.trim());
}

export { isGeminiQuotaError };
