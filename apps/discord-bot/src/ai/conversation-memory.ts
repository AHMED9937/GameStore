export type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
  at: number;
};

type Session = {
  turns: ConversationTurn[];
  updatedAt: number;
};

const MAX_TURNS = 5;
const TTL_MS = 30 * 60 * 1000;

const sessions = new Map<string, Session>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.updatedAt > TTL_MS) {
      sessions.delete(key);
    }
  }
}

export function getSessionKey(channelId: string): string {
  return channelId;
}

export function appendTurn(
  channelId: string,
  turn: Omit<ConversationTurn, 'at'>,
): void {
  pruneExpired();
  const key = getSessionKey(channelId);
  const existing = sessions.get(key) ?? { turns: [], updatedAt: Date.now() };
  existing.turns.push({ ...turn, at: Date.now() });
  if (existing.turns.length > MAX_TURNS) {
    existing.turns = existing.turns.slice(-MAX_TURNS);
  }
  existing.updatedAt = Date.now();
  sessions.set(key, existing);
}

export function getHistory(channelId: string): ConversationTurn[] {
  pruneExpired();
  const session = sessions.get(getSessionKey(channelId));
  return session?.turns ?? [];
}

export function clearSession(channelId: string): void {
  sessions.delete(getSessionKey(channelId));
}

export function formatHistoryForPrompt(channelId: string): string {
  const turns = getHistory(channelId);
  if (turns.length === 0) return '';
  return turns
    .map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
    .join('\n');
}

/** Test helper */
export function resetAllSessions(): void {
  sessions.clear();
}
