import { describe, expect, it } from 'vitest';
import {
  displayNameFromParts,
  jwtHasRoleClaim,
  parseProfileUpdateInput,
  parseUserRole,
  parseUserRoleFromJwtClaims,
  primaryEmailFromClerkUser,
} from './auth.types';

describe('auth.types', () => {
  it('parseUserRole returns admin only when metadata.role is admin', () => {
    expect(parseUserRole({ role: 'admin' })).toBe('admin');
    expect(parseUserRole({ role: 'user' })).toBe('user');
    expect(parseUserRole(null)).toBe('user');
  });

  it('parseUserRoleFromJwtClaims reads metadata or public_metadata', () => {
    expect(parseUserRoleFromJwtClaims({ metadata: { role: 'admin' } })).toBe(
      'admin',
    );
    expect(
      parseUserRoleFromJwtClaims({ public_metadata: { role: 'admin' } }),
    ).toBe('admin');
    expect(parseUserRoleFromJwtClaims({ sub: 'user_1' })).toBe('user');
  });

  it('jwtHasRoleClaim detects explicit role claims', () => {
    expect(jwtHasRoleClaim({ metadata: { role: 'user' } })).toBe(true);
    expect(jwtHasRoleClaim({ public_metadata: { role: 'admin' } })).toBe(true);
    expect(jwtHasRoleClaim({ sub: 'user_1' })).toBe(false);
  });

  it('primaryEmailFromClerkUser prefers the primary email address', () => {
    const email = primaryEmailFromClerkUser({
      primary_email_address_id: 'eml_2',
      email_addresses: [
        { id: 'eml_1', email_address: 'old@example.com' },
        { id: 'eml_2', email_address: 'primary@example.com' },
      ],
    });

    expect(email).toBe('primary@example.com');
  });

  it('parseProfileUpdateInput trims and validates names', () => {
    expect(parseProfileUpdateInput({ firstName: ' Ada ', lastName: 'Lovelace' })).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(() => parseProfileUpdateInput({ firstName: '', lastName: 'X' })).toThrow(
      /First name/,
    );
  });

  it('displayNameFromParts prefers names over email', () => {
    expect(
      displayNameFromParts({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      }),
    ).toBe('Ada Lovelace');
    expect(
      displayNameFromParts({
        firstName: null,
        lastName: null,
        email: 'ada@example.com',
      }),
    ).toBe('ada@example.com');
  });
});
