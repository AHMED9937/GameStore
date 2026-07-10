import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  isGeminiQuotaPaused,
  markGeminiQuotaExceeded,
  resetGeminiQuotaState,
} from './gemini-quota';

describe('gemini-quota', () => {
  afterEach(() => {
    resetGeminiQuotaState();
    vi.useRealTimers();
  });

  it('pauses gemini after quota exceeded', () => {
    markGeminiQuotaExceeded(60_000);
    expect(isGeminiQuotaPaused()).toBe(true);
  });

  it('resumes after backoff expires', () => {
    vi.useFakeTimers();
    markGeminiQuotaExceeded(1000);
    expect(isGeminiQuotaPaused()).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(isGeminiQuotaPaused()).toBe(false);
  });
});
