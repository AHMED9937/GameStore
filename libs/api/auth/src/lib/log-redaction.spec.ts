import { describe, expect, it } from 'vitest';
import { licenseKeyAuditHint, redactForAuditLog } from './log-redaction';

describe('log-redaction', () => {
  it('redacts sensitive fields from objects', () => {
    expect(
      redactForAuditLog({
        licenseKey: 'ABCD-1234-SECRET',
        password: 'hunter2',
        gameId: 'game-1',
      }),
    ).toEqual({
      licenseKey: '[REDACTED]',
      password: '[REDACTED]',
      gameId: 'game-1',
    });
  });

  it('licenseKeyAuditHint keeps only the last four characters', () => {
    expect(licenseKeyAuditHint('DEMO-KEY-0001')).toBe('****0001');
    expect(licenseKeyAuditHint('AB')).toBe('****');
  });
});
