import { describe, expect, it } from 'vitest';
import { matchKnowledge } from './knowledge/faq-pack';
import {
  looksLikeCredentialRequest,
  looksLikePastedLicenseKey,
  sanitizeReply,
  shouldForceEscalate,
} from './safety';

describe('faq-pack matchKnowledge', () => {
  it('matches ubisoft offline', () => {
    expect(matchKnowledge('how do I put ubisoft offline?')?.id).toBe(
      'ubisoft-offline',
    );
  });

  it('matches saves', () => {
    expect(matchKnowledge('will cloud saves conflict?')?.id).toBe(
      'personal-saves',
    );
  });
});

describe('safety', () => {
  it('detects credential requests', () => {
    expect(looksLikeCredentialRequest('send me the password')).toBe(true);
    expect(looksLikeCredentialRequest('how do I go offline?')).toBe(false);
  });

  it('does not flag informational guard questions', () => {
    expect(looksLikeCredentialRequest('where is steam guard code')).toBe(false);
    expect(looksLikeCredentialRequest('how do I get 2fa')).toBe(false);
  });

  it('detects pasted license keys', () => {
    expect(looksLikePastedLicenseKey('key ABCD-EFGH-IJKL-MNOP')).toBe(true);
    expect(looksLikePastedLicenseKey('hello')).toBe(false);
  });

  it('detects escalation topics', () => {
    expect(shouldForceEscalate('I want a refund')).toBe(true);
  });

  it('redacts license-like strings', () => {
    expect(sanitizeReply('key ABCD-EFGH-IJKL-MNOP')).toContain('[redacted]');
  });

  it('masks emails in replies', () => {
    expect(sanitizeReply('contact user@example.com')).toContain('***@example.com');
  });
});
