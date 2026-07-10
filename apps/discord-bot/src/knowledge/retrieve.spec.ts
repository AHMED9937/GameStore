import { describe, expect, it } from 'vitest';
import { matchKnowledge } from './faq-pack';
import { bestKnowledgeMatch, retrieveKnowledge } from './retrieve';
import cases from '../eval/support-cases.json';

describe('retrieveKnowledge', () => {
  it('returns ubisoft doc for ubisoft offline question', () => {
    const docs = retrieveKnowledge('how do I put ubisoft offline?');
    expect(docs[0]?.id).toBe('ubisoft-offline');
  });

  it('returns saves doc for cloud saves', () => {
    expect(matchKnowledge('will cloud saves conflict?')?.id).toBe('personal-saves');
  });

  it('does not match lost-license on order alone', () => {
    const { doc } = bestKnowledgeMatch('my order number is 12345');
    expect(doc?.id).not.toBe('lost-license');
  });

  it.each(cases.filter((c) => c.expectIntent && c.expectTier === 'A'))(
    'retrieves doc for A-tier: $message',
    ({ message, expectIntent }) => {
      const docs = retrieveKnowledge(message, 3);
      const ids = docs.map((d) => d.id);
      expect(ids).toContain(expectIntent);
    },
  );
});
