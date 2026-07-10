import { describe, expect, it } from 'vitest';
import {
  appendTurn,
  clearSession,
  formatHistoryForPrompt,
  getHistory,
  resetAllSessions,
} from './conversation-memory';

describe('conversation-memory', () => {
  it('stores and returns turns', () => {
    resetAllSessions();
    appendTurn('ch1', { role: 'user', content: 'ubisoft offline?' });
    appendTurn('ch1', { role: 'assistant', content: 'block firewall' });
    expect(getHistory('ch1')).toHaveLength(2);
    expect(formatHistoryForPrompt('ch1')).toContain('ubisoft offline');
  });

  it('clears session', () => {
    resetAllSessions();
    appendTurn('ch2', { role: 'user', content: 'test' });
    clearSession('ch2');
    expect(getHistory('ch2')).toHaveLength(0);
  });
});
