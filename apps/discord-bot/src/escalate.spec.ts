import { describe, expect, it } from 'vitest';
import { resetEscalationDedupe, shouldSkipEscalation } from './escalate';

describe('escalation dedupe', () => {
  it('dedupes repeated escalations within window', () => {
    resetEscalationDedupe();
    expect(shouldSkipEscalation('user1', 'refund')).toBe(false);
    expect(shouldSkipEscalation('user1', 'refund')).toBe(true);
    expect(shouldSkipEscalation('user2', 'refund')).toBe(false);
  });
});
