import { describe, expect, it } from 'vitest';
import {
  looksLikeHumanRequest,
  looksStillStuck,
} from './stuck-detection';

describe('stuck-detection', () => {
  it('detects still stuck phrases', () => {
    expect(looksStillStuck('still not working')).toBe(true);
    expect(looksStillStuck("that didn't work")).toBe(true);
    expect(looksStillStuck('wrong answer')).toBe(true);
    expect(looksStillStuck('open a ticket please')).toBe(true);
  });

  it('does not flag normal questions', () => {
    expect(looksStillStuck('how do I activate')).toBe(false);
  });

  it('detects human requests', () => {
    expect(looksLikeHumanRequest('speak to a real person')).toBe(true);
    expect(looksLikeHumanRequest('how to go offline')).toBe(false);
  });
});
