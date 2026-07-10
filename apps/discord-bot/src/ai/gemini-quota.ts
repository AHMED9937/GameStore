const DEFAULT_BACKOFF_MS = 60 * 60 * 1000; // 1 hour — avoid hammering a dead quota

let pausedUntil = 0;
let quotaWarnLogged = false;

export function markGeminiQuotaExceeded(backoffMs = DEFAULT_BACKOFF_MS): void {
  pausedUntil = Date.now() + backoffMs;
  if (!quotaWarnLogged) {
    quotaWarnLogged = true;
    console.warn(
      `[gemini] API quota exceeded (429). FAQ fallback active until ${new Date(pausedUntil).toISOString()}.`,
    );
    console.warn(
      '[gemini] Fix: enable billing or check quota at https://aistudio.google.com/apikey',
    );
  }
}

export function isGeminiQuotaPaused(): boolean {
  if (pausedUntil === 0) return false;
  if (Date.now() >= pausedUntil) {
    pausedUntil = 0;
    quotaWarnLogged = false;
    console.log('[gemini] Quota pause expired — will retry Gemini on next message.');
    return false;
  }
  return true;
}

export function geminiPausedUntilIso(): string | null {
  return pausedUntil > Date.now() ? new Date(pausedUntil).toISOString() : null;
}

export function isGeminiQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('429') || msg.toLowerCase().includes('quota');
}

/** Test helper */
export function resetGeminiQuotaState(): void {
  pausedUntil = 0;
  quotaWarnLogged = false;
}
