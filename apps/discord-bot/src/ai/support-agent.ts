import { callGeminiSupport, isGeminiEnabled } from './gemini-client';
import {
  geminiPausedUntilIso,
  isGeminiQuotaError,
  isGeminiQuotaPaused,
  markGeminiQuotaExceeded,
} from './gemini-quota';
import { classifyIntent, tryDeterministicAnswer } from './intent-router';
import { recordAnswer, recordGeminiError } from './metrics';
import { formatDocReply } from '../knowledge/faq-pack';
import { formatIntentLinks } from '../knowledge/intent-links';
import { ticketOpenHint } from '../knowledge/links';
import { retrieveForQuestion } from '../knowledge/retrieve';
import {
  looksLikeHumanRequest,
  looksStillStuck,
} from '../tickets/stuck-detection';
import {
  CREDENTIAL_REDIRECT,
  looksLikeCredentialRequest,
  looksLikePastedLicenseKey,
  LOW_CONFIDENCE_THRESHOLD,
  PASTED_KEY_WARNING,
  shouldForceEscalate,
  type SupportDecision,
} from '../safety';

export type SupportContext = {
  channelId: string;
  userId: string;
};

function applyOpenTicketFlags(
  decision: SupportDecision,
  question: string,
): SupportDecision {
  const human =
    looksLikeHumanRequest(question) || decision.intent === 'human-request';
  const stuck = looksStillStuck(question);
  const lowConfidence =
    decision.confidence !== undefined &&
    decision.confidence < LOW_CONFIDENCE_THRESHOLD;
  const escalateTicket = Boolean(decision.escalate && decision.suggestTicket);

  const openTicket =
    human || stuck || escalateTicket || (decision.escalate && lowConfidence);

  if (!openTicket) return decision;

  let ticketReason = decision.ticketReason;
  if (stuck) ticketReason = 'User still stuck after bot answer';
  else if (human) ticketReason = 'User requested human support';
  else if (escalateTicket) ticketReason = decision.reason ?? 'Escalated support';
  else if (lowConfidence) ticketReason = 'Low confidence answer';

  return {
    ...decision,
    openTicket: true,
    suggestTicket: true,
    ticketReason,
  };
}

function enrichReplyWithLinks(decision: SupportDecision): SupportDecision {
  if (!decision.intent) return decision;
  const links = formatIntentLinks(decision.intent);
  if (!links || decision.reply.includes(links.slice(0, 20))) return decision;
  if (decision.reply.includes('**Next step:**')) return decision;

  return {
    ...decision,
    reply: `${decision.reply}\n\n${links}`,
  };
}

function keywordFallback(question: string): SupportDecision {
  if (looksLikeCredentialRequest(question)) {
    return {
      reply: CREDENTIAL_REDIRECT,
      escalate: false,
      confidence: 1,
      intent: 'credential-request',
    };
  }
  if (shouldForceEscalate(question)) {
    return {
      reply:
        `This needs staff review. I am escalating — ${ticketOpenHint()}`,
      escalate: true,
      confidence: 1,
      intent: 'refund-dispute',
      reason: 'Sensitive topic (refund/ban/payment)',
      suggestTicket: true,
    };
  }

  const docs = retrieveForQuestion(question, null, 1);
  const doc = docs[0];
  if (!doc) {
    return {
      reply:
        `I am not sure about that. ${ticketOpenHint()} — staff have been notified.`,
      escalate: true,
      confidence: 0.3,
      reason: 'No FAQ match',
      suggestTicket: true,
    };
  }

  return {
    reply: formatDocReply(doc),
    escalate: doc.tier === 'B',
    confidence: 0.75,
    intent: doc.id,
    suggestTicket: doc.tier === 'B',
    retrievedDocIds: [doc.id],
  };
}

function richFallback(question: string): SupportDecision {
  const deterministic = tryDeterministicAnswer(question);
  if (deterministic) return deterministic;
  return keywordFallback(question);
}

function finalizeDecision(
  decision: SupportDecision,
  question: string,
): SupportDecision {
  return applyOpenTicketFlags(enrichReplyWithLinks(decision), question);
}

export async function answerSupportQuestion(
  question: string,
  context?: SupportContext,
): Promise<SupportDecision> {
  if (looksLikePastedLicenseKey(question)) {
    const decision = finalizeDecision(
      {
        reply: PASTED_KEY_WARNING,
        escalate: true,
        confidence: 1,
        intent: 'pasted-license-key',
        reason: 'User posted likely license key in chat',
        suggestTicket: true,
      },
      question,
    );
    recordAnswer({ escalate: true, confidence: 1, source: 'deterministic' });
    return decision;
  }

  if (looksLikeCredentialRequest(question) && !shouldForceEscalate(question)) {
    const decision = finalizeDecision(
      {
        reply: CREDENTIAL_REDIRECT,
        escalate: false,
        confidence: 1,
        intent: 'credential-request',
      },
      question,
    );
    recordAnswer({ escalate: false, confidence: 1, source: 'deterministic' });
    return decision;
  }

  const intentHint = classifyIntent(question)?.id ?? null;
  const retrievedDocs = retrieveForQuestion(question, intentHint, 5);
  const forceEscalate = shouldForceEscalate(question);

  const canUseGemini = isGeminiEnabled() && !isGeminiQuotaPaused();

  if (canUseGemini) {
    try {
      const ai = await callGeminiSupport(question, {
        channelId: context?.channelId,
        intentHint,
        forceEscalate,
        retrievedDocs,
      });

      const decision = finalizeDecision(ai, question);
      recordAnswer({
        escalate: decision.escalate,
        confidence: decision.confidence,
        source: 'gemini',
      });
      return decision;
    } catch (err) {
      recordGeminiError();
      if (isGeminiQuotaError(err)) {
        markGeminiQuotaExceeded();
      } else {
        console.warn(
          '[support-agent] Gemini failed, using FAQ fallback:',
          err instanceof Error ? err.message.slice(0, 120) : err,
        );
      }
    }
  }

  const fallback = finalizeDecision(richFallback(question), question);
  recordAnswer({
    escalate: fallback.escalate,
    confidence: fallback.confidence,
    source: 'deterministic',
  });
  return fallback;
}

export { geminiPausedUntilIso, isGeminiQuotaPaused };
