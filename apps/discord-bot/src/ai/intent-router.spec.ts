import { describe, expect, it } from 'vitest';
import { classifyIntent, handleIntent, tryDeterministicAnswer } from './intent-router';
import cases from '../eval/support-cases.json';

describe('classifyIntent', () => {
  it.each(cases.filter((c) => c.expectIntent))(
    'classifies: $message',
    ({ message, expectIntent }) => {
      const result = classifyIntent(message);
      expect(result?.id).toBe(expectIntent);
    },
  );

  it('does not classify vague order-only message as lost-license', () => {
    expect(classifyIntent('my order number is 12345')).toBeNull();
  });
});

describe('handleIntent escalation', () => {
  it('escalates refund requests', () => {
    const decision = handleIntent('refund-dispute', 'I want a refund');
    expect(decision?.escalate).toBe(true);
  });

  it('redirects credential requests without escalation', () => {
    const decision = handleIntent('credential-request', 'send password');
    expect(decision?.escalate).toBe(false);
    expect(decision?.reply).toContain('My Games');
  });
});

describe('tryDeterministicAnswer', () => {
  it.each(
    cases.filter((c) => c.expectEscalate === false && c.expectIntent),
  )('answers without escalate: $message', ({ message }) => {
    const decision = tryDeterministicAnswer(message);
    expect(decision).not.toBeNull();
    expect(decision?.escalate).toBe(false);
    expect(decision?.reply.length).toBeGreaterThan(10);
  });

  it('escalates refund via deterministic path', () => {
    const decision = tryDeterministicAnswer('I need a refund now');
    expect(decision?.escalate).toBe(true);
  });
});
