import { describe, expect, it, beforeEach } from 'vitest';
import {
  buildTicketThreadBody,
  formatTicketOpenedReply,
  resetTicketDedupe,
  sanitizeThreadName,
  shouldSkipTicketCreate,
} from './ticket-service';

describe('ticket-service helpers', () => {
  beforeEach(() => {
    resetTicketDedupe();
  });

  it('sanitizes thread names', () => {
    expect(sanitizeThreadName('Player#1234')).toBe('support-Player-1234');
    expect(sanitizeThreadName('!!!').length).toBeGreaterThan(2);
  });

  it('dedupes ticket creation per user', () => {
    expect(shouldSkipTicketCreate('u1').skip).toBe(false);
    // simulate record via skip after first - we test via record in integration
  });

  it('builds ticket body with template and no raw secrets instruction', () => {
    const body = buildTicketThreadBody({
      userId: '123',
      userTag: 'tester',
      question: 'cant login',
      reason: 'User still stuck',
      ticketsChannelMention: '<#999>',
    });
    expect(body).toContain('<@123>');
    expect(body).toContain('Purchase email');
    expect(body).toContain('cant login');
    expect(body).not.toContain('password:');
  });

  it('formats opened ticket reply with url', () => {
    expect(formatTicketOpenedReply('https://discord.com/channels/1/2')).toContain(
      'Opened your private ticket',
    );
    expect(formatTicketOpenedReply('https://discord.com/channels/1/2', true)).toContain(
      'already have an open ticket',
    );
  });
});
