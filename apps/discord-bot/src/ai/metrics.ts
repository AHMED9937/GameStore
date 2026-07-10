type Counters = {
  answered: number;
  escalated: number;
  geminiErrors: number;
  deterministic: number;
  confidenceSum: number;
  confidenceCount: number;
};

const counters: Counters = {
  answered: 0,
  escalated: 0,
  geminiErrors: 0,
  deterministic: 0,
  confidenceSum: 0,
  confidenceCount: 0,
};

export function recordAnswer(opts: {
  escalate: boolean;
  confidence?: number;
  source: 'deterministic' | 'gemini' | 'fallback';
}): void {
  counters.answered += 1;
  if (opts.escalate) counters.escalated += 1;
  if (opts.source === 'deterministic') counters.deterministic += 1;
  if (opts.confidence !== undefined) {
    counters.confidenceSum += opts.confidence;
    counters.confidenceCount += 1;
  }
}

export function recordGeminiError(): void {
  counters.geminiErrors += 1;
}

export function getMetrics(): Counters & { avgConfidence: number } {
  return {
    ...counters,
    avgConfidence:
      counters.confidenceCount > 0
        ? counters.confidenceSum / counters.confidenceCount
        : 0,
  };
}

export function logMetrics(): void {
  const m = getMetrics();
  console.log(
    `[metrics] answered=${m.answered} escalated=${m.escalated} deterministic=${m.deterministic} gemini_errors=${m.geminiErrors} avg_confidence=${m.avgConfidence.toFixed(2)}`,
  );
}

/** Test helper */
export function resetMetrics(): void {
  counters.answered = 0;
  counters.escalated = 0;
  counters.geminiErrors = 0;
  counters.deterministic = 0;
  counters.confidenceSum = 0;
  counters.confidenceCount = 0;
}
