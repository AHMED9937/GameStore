import { describe, expect, it } from 'vitest';
import { buildForwardHeaders } from './proxy-headers';

describe('proxy-headers', () => {
  it('forwards Authorization to Nest BFF upstream', () => {
    const incoming = new Headers({
      accept: 'application/json',
      authorization: 'Bearer test.jwt.token',
      'content-type': 'application/json',
    });

    const forwarded = buildForwardHeaders(incoming);

    expect(forwarded.get('authorization')).toBe('Bearer test.jwt.token');
    expect(forwarded.get('accept')).toBe('application/json');
    expect(forwarded.get('content-type')).toBe('application/json');
  });

  it('omits authorization when not present', () => {
    const forwarded = buildForwardHeaders(new Headers({ accept: 'application/json' }));
    expect(forwarded.get('authorization')).toBeNull();
  });
});
