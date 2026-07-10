const STUCK_PATTERNS = [
  /\bstill\s+(not|doesn't|doesnt|isn't|isnt)\b/i,
  /\b(didn't|didnt|doesn't|doesnt)\s+work\b/i,
  /\bnot\s+working\b/i,
  /\bwrong\s+answer\b/i,
  /\bnot\s+helpful\b/i,
  /\bthat\s+didn't\s+help\b/i,
  /\bneed\s+(a\s+)?human\b/i,
  /\b(speak|talk)\s+to\s+(staff|admin|someone|a\s+person)\b/i,
  /\breal\s+person\b/i,
  /\bopen\s+(a\s+)?ticket\b/i,
  /\bhelp\s+me\s+(please|now)\b/i,
];

const HUMAN_REQUEST_PATTERNS = [
  /\b(speak to|talk to)\b.*\b(human|admin|staff|owner|person)\b/i,
  /\breal person\b/i,
  /\bhuman support\b/i,
];

export function looksStillStuck(message: string): boolean {
  return STUCK_PATTERNS.some((p) => p.test(message));
}

export function looksLikeHumanRequest(message: string): boolean {
  return HUMAN_REQUEST_PATTERNS.some((p) => p.test(message));
}
