export type SupportDecision = {
  reply: string;
  escalate: boolean;
  reason?: string;
  confidence?: number;
  intent?: string;
  links?: string[];
  suggestTicket?: boolean;
  retrievedDocIds?: string[];
  openTicket?: boolean;
  ticketReason?: string;
};

const ESCALATE_PATTERNS =
  /\b(refund|chargeback|ban|banned|stolen|hack|lawsuit|lawyer|dispute|scam|fraud|payment failed|stripe)\b/i;

const CREDENTIAL_PATTERNS =
  /\b(password|shared.?secret|steam.?guard|2fa code|totp|license key|cd.?key)\b/i;

/** Likely pasted license key (XXXX-XXXX-...) */
const LICENSE_KEY_PATTERN =
  /\b[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2,}\b/i;

const MAX_USER_MESSAGE_LENGTH = 2000;

export function shouldForceEscalate(message: string): boolean {
  return ESCALATE_PATTERNS.test(message);
}

export function looksLikeCredentialRequest(message: string): boolean {
  // Informational questions about where to get codes — not secret requests
  if (
    /\b(where|how)\b.*\b(get|find|see|view)\b.*\b(steam.?guard|2fa|password|credentials|license)\b/i.test(
      message,
    )
  ) {
    return false;
  }
  if (/\b(where|how)\b.*\b(steam.?guard|2fa|guard code)\b/i.test(message)) {
    return false;
  }
  // User asking bot/staff to provide secrets
  return (
    /\b(send|give|paste|share|tell me|what is the|dm me)\b.*\b(password|guard|2fa|license key|cd.?key|shared.?secret)\b/i.test(
      message,
    ) ||
    /\b(password|steam guard code|license key)\s*\?/i.test(message)
  );
}

export function looksLikePastedLicenseKey(message: string): boolean {
  return LICENSE_KEY_PATTERN.test(message);
}

export function isMessageTooLong(message: string): boolean {
  return message.length > MAX_USER_MESSAGE_LENGTH;
}

export function isEmbedOnlyMessage(content: string, hasEmbeds: boolean): boolean {
  return hasEmbeds && content.trim().length === 0;
}

export function sanitizeReply(reply: string): string {
  return reply
    .replace(/\b[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3,}\b/gi, '[redacted]')
    .replace(/\b(?:password|pwd)\s*[:=]\s*\S+/gi, 'password: [use My Games on the website]')
    .replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      (email) => {
        const [user, domain] = email.split('@');
        if (!user || !domain) return '[email]';
        const masked =
          user.length <= 2 ? '**' : `${user.slice(0, 2)}***`;
        return `${masked}@${domain}`;
      },
    )
    .trim();
}

export const CREDENTIAL_REDIRECT =
  'For account passwords, Steam Guard codes, or license keys, please use the **website My Games** page only. We never share credentials in Discord.';

export const PASTED_KEY_WARNING =
  'Please **do not post license keys** in public channels. Use **My Games** on the website. Staff have been notified.';

export const LOW_CONFIDENCE_THRESHOLD = 0.55;
