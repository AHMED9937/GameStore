import type { SupportDecision } from '../safety';
import {
  CREDENTIAL_REDIRECT,
  looksLikeCredentialRequest,
  shouldForceEscalate,
} from '../safety';
import { formatDocReply, getDocById } from '../knowledge/faq-pack';
import { bestKnowledgeMatch } from '../knowledge/retrieve';
import { siteLink, SITE_PATHS, TICKET_TEMPLATE, ticketOpenHint } from '../knowledge/links';

export type IntentId =
  | 'credential-request'
  | 'human-request'
  | 'refund-dispute'
  | 'fraud-legal'
  | 'ban-stolen'
  | 'steam-guard-location'
  | 'steam-guard-cooldown'
  | 'sign-in-required'
  | 'lost-license'
  | 'how-to-activate'
  | 'steam-offline'
  | 'ubisoft-offline'
  | 'personal-saves'
  | 'games-to-replace'
  | 'where-to-buy'
  | 'subscriptions'
  | 'sold-out'
  | 'checkout-success'
  | 'wrong-credentials'
  | 'payment-no-license'
  | 'technical-edge';

type IntentRule = {
  id: IntentId;
  patterns: RegExp[];
  keywords: string[];
  weight?: number;
};

const INTENT_RULES: IntentRule[] = [
  {
    id: 'credential-request',
    patterns: [
      /\b(send|give|paste|share)\b.*\b(password|guard|2fa|license key|cd.?key)\b/i,
      /\bwhat is the password\b/i,
      /\bsteam guard code\b/i,
    ],
    keywords: ['password', 'steam guard', '2fa code', 'license key'],
    weight: 10,
  },
  {
    id: 'human-request',
    patterns: [/\b(speak to|talk to)\b.*\b(human|admin|staff|owner|person)\b/i],
    keywords: ['real person', 'human support', 'talk to staff'],
    weight: 8,
  },
  {
    id: 'refund-dispute',
    patterns: [
      /\b(refund|chargeback|money back|dispute)\b/i,
      /\bpayment failed\b/i,
    ],
    keywords: ['refund', 'chargeback', 'dispute', 'stripe failed'],
    weight: 10,
  },
  {
    id: 'fraud-legal',
    patterns: [/\b(scam|fraud|lawyer|lawsuit|sue)\b/i],
    keywords: ['scam', 'fraud', 'lawyer', 'lawsuit'],
    weight: 10,
  },
  {
    id: 'ban-stolen',
    patterns: [
      /\b(banned|stolen|hacked)\b.*\b(account|steam)\b/i,
      /\b(account|steam)\b.*\b(banned|stolen|hacked)\b/i,
    ],
    keywords: ['account banned', 'stolen account', 'was stolen'],
    weight: 7,
  },
  {
    id: 'steam-guard-cooldown',
    patterns: [
      /\b(try again in|cooldown|wait \d+ (second|minute))\b/i,
      /\bcode not working\b/i,
    ],
    keywords: ['cooldown', 'try again', '429', 'locked until'],
    weight: 6,
  },
  {
    id: 'steam-guard-location',
    patterns: [
      /\b(where|how).*\b(steam guard|2fa|guard code|totp)\b/i,
      /\bget.*\b(2fa|guard)\b/i,
    ],
    keywords: ['where is steam guard', 'guard code', '2fa code'],
    weight: 6,
  },
  {
    id: 'sign-in-required',
    patterns: [
      /\b(cant|cannot|can't)\b.*\b(see|view)\b.*\b(password|credentials)\b/i,
      /\bneed to sign in\b/i,
    ],
    keywords: ['sign in', 'log in', 'cant see password'],
    weight: 6,
  },
  {
    id: 'lost-license',
    patterns: [
      /\b(lost|forgot|missing)\b.*\b(license|key)\b/i,
      /\brecover\b.*\blicense\b/i,
    ],
    keywords: ['lost license', 'forgot key', 'license recovery'],
    weight: 5,
  },
  {
    id: 'payment-no-license',
    patterns: [
      /\b(paid|charged|payment)\b.*\b(no license|no key|missing)\b/i,
      /\bno license\b.*\b(paid|purchase)\b/i,
    ],
    keywords: ['paid but no', 'charged but', 'missing license'],
    weight: 6,
  },
  {
    id: 'wrong-credentials',
    patterns: [
      /\b(wrong game|wrong account)\b/i,
      /\b(cant|cannot|can't)\b.*\blogin\b/i,
      /\b(credentials|password)\b.*\b(dont|doesn't|not)\b.*\bwork\b/i,
      /\bnot working\b/i,
    ],
    keywords: ['wrong game', 'cant login', 'credentials dont work'],
    weight: 4,
  },
  {
    id: 'sold-out',
    patterns: [/\b(sold out|out of stock)\b/i],
    keywords: ['sold out', 'cant checkout'],
    weight: 5,
  },
  {
    id: 'subscriptions',
    patterns: [/\b(subscription|subscribe|monthly plan)\b/i],
    keywords: ['subscription', 'catalogue'],
    weight: 4,
  },
  {
    id: 'checkout-success',
    patterns: [
      /\b(just bought|after purchase|checkout success)\b/i,
      /\bwhere is my (game|license|key)\b/i,
    ],
    keywords: ['just bought', 'after purchase'],
    weight: 4,
  },
  {
    id: 'how-to-activate',
    patterns: [
      /\bhow\b.*\b(activat\w*|play|start)\b/i,
      /\b(activat\w*|error when activating)\b/i,
      /\bget credentials\b/i,
    ],
    keywords: ['how to activate', 'how do i play', 'my games', 'error when activating'],
    weight: 4,
  },
  {
    id: 'steam-offline',
    patterns: [
      /\bsteam\b.*\boffline\b/i,
      /\bgo offline\b/i,
      /\boffline\b/i,
    ],
    keywords: ['steam offline', 'play offline', 'work offline'],
    weight: 4,
  },
  {
    id: 'ubisoft-offline',
    patterns: [/\b(ubisoft|uplay)\b.*\boffline\b/i],
    keywords: ['ubisoft offline', 'uplay'],
    weight: 4,
  },
  {
    id: 'personal-saves',
    patterns: [/\b(cloud save|saves|save game)\b/i],
    keywords: ['cloud sync', 'personal saves'],
    weight: 3,
  },
  {
    id: 'games-to-replace',
    patterns: [
      /\b(to replace|account not working|games to replace)\b/i,
    ],
    keywords: ['games to replace', 'replace badge', 'account not working'],
    weight: 6,
  },
  {
    id: 'where-to-buy',
    patterns: [/\b(where|how)\b.*\b(buy|shop|purchase)\b/i],
    keywords: ['buy game', 'shop', 'price'],
    weight: 3,
  },
  {
    id: 'technical-edge',
    patterns: [/\b(antivirus|defender|eac|easy anti cheat|crash)\b/i],
    keywords: ['antivirus', 'firewall', 'launcher crash'],
    weight: 3,
  },
];

export type ClassifiedIntent = {
  id: IntentId;
  score: number;
};

export function classifyIntent(message: string): ClassifiedIntent | null {
  const q = message.toLowerCase();
  let best: ClassifiedIntent | null = null;

  for (const rule of INTENT_RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) score += 3;
    }
    for (const keyword of rule.keywords) {
      if (q.includes(keyword.toLowerCase())) score += 2;
    }
    if (rule.weight) score += 0;

    if (score > 0 && (!best || score > best.score)) {
      best = { id: rule.id, score };
    }
  }

  // Avoid "order" alone matching lost-license — require license/key context
  if (best?.id === 'lost-license' && /\border\b/i.test(q) && !/\b(license|key)\b/i.test(q)) {
    return null;
  }

  // Prefer specific phrases over generic "not working"
  if (/\baccount not working\b/i.test(message)) {
    return { id: 'games-to-replace', score: 10 };
  }

  return best && best.score >= 2 ? best : null;
}

const INTENT_TO_DOC: Partial<Record<IntentId, string>> = {
  'steam-guard-location': 'steam-guard-location',
  'steam-guard-cooldown': 'steam-guard-cooldown',
  'sign-in-required': 'sign-in-required',
  'lost-license': 'lost-license',
  'how-to-activate': 'how-to-activate',
  'steam-offline': 'steam-offline',
  'ubisoft-offline': 'ubisoft-offline',
  'personal-saves': 'personal-saves',
  'games-to-replace': 'games-to-replace',
  'where-to-buy': 'where-to-buy',
  'subscriptions': 'subscriptions',
  'sold-out': 'sold-out',
  'checkout-success': 'checkout-success',
  'wrong-credentials': 'wrong-credentials',
  'payment-no-license': 'payment-no-license',
  'technical-edge': 'technical-edge',
};

export function handleIntent(
  intent: IntentId,
  message: string,
): SupportDecision | null {
  if (intent === 'credential-request' || looksLikeCredentialRequest(message)) {
    return {
      reply: CREDENTIAL_REDIRECT,
      escalate: false,
      confidence: 1,
      intent: 'credential-request',
    };
  }

  if (intent === 'refund-dispute' || shouldForceEscalate(message)) {
    return {
      reply:
        `This needs staff review. I am escalating to the owner — ${ticketOpenHint()}`,
      escalate: true,
      confidence: 1,
      intent: 'refund-dispute',
      reason: 'Refund / payment dispute',
      suggestTicket: true,
    };
  }

  if (intent === 'fraud-legal') {
    return {
      reply:
        `I am escalating this to staff immediately. ${ticketOpenHint()}`,
      escalate: true,
      confidence: 1,
      intent: 'fraud-legal',
      reason: 'Fraud / legal topic',
      suggestTicket: true,
    };
  }

  if (intent === 'ban-stolen') {
    return {
      reply:
        `Account ban or theft claims need staff. I am escalating — ${ticketOpenHint()}`,
      escalate: true,
      confidence: 0.9,
      intent: 'ban-stolen',
      reason: 'Ban / stolen account',
      suggestTicket: true,
    };
  }

  if (intent === 'human-request') {
    return {
      reply:
        `Staff have been notified. For faster help, ${ticketOpenHint()}`,
      escalate: true,
      confidence: 1,
      intent: 'human-request',
      reason: 'User requested human',
      suggestTicket: true,
    };
  }

  const docId = INTENT_TO_DOC[intent];
  if (docId) {
    const doc = getDocById(docId);
    if (doc) {
      const suggestTicket = doc.tier === 'B';
      return {
        reply: formatDocReply(doc),
        escalate: false,
        confidence: 0.85,
        intent,
        suggestTicket,
        links: doc.sitePath ? [siteLink(doc.sitePath)] : undefined,
      };
    }
  }

  return null;
}

export function tryDeterministicAnswer(message: string): SupportDecision | null {
  const classified = classifyIntent(message);
  if (classified) {
    const handled = handleIntent(classified.id, message);
    if (handled) return handled;
  }

  const { doc, score } = bestKnowledgeMatch(message);
  if (doc && score >= 4) {
    return {
      reply: formatDocReply(doc),
      escalate: false,
      confidence: Math.min(0.95, 0.6 + score * 0.05),
      intent: doc.id,
      suggestTicket: doc.tier === 'B',
      links: doc.sitePath ? [siteLink(doc.sitePath)] : undefined,
    };
  }

  return null;
}

export function ticketGuidanceReply(): string {
  return TICKET_TEMPLATE;
}
