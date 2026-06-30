import { describe, expect, it } from 'vitest';
import {
  buildAdminPostSignInTarget,
  buildAuthRedirectTarget,
  resolvePostAuthPath,
  resolvePostAuthPathForRole,
  resolveSignInPath,
} from './auth-role';

describe('auth redirect helpers', () => {
  it('buildAuthRedirectTarget encodes redirect_url', () => {
    expect(buildAuthRedirectTarget('/my-games')).toBe(
      '/auth/redirect?redirect_url=%2Fmy-games',
    );
    expect(buildAuthRedirectTarget()).toBe('/auth/redirect');
  });

  it('buildAdminPostSignInTarget defaults to admin dashboard', () => {
    expect(buildAdminPostSignInTarget()).toBe(
      '/auth/redirect?redirect_url=%2Fadmin',
    );
  });

  it('buildAdminPostSignInTarget keeps safe admin redirect_url', () => {
    expect(buildAdminPostSignInTarget('/admin/games')).toBe(
      '/auth/redirect?redirect_url=%2Fadmin%2Fgames',
    );
  });

  it('buildAdminPostSignInTarget ignores non-admin redirect_url', () => {
    expect(buildAdminPostSignInTarget('/my-games')).toBe(
      '/auth/redirect?redirect_url=%2Fadmin',
    );
  });

  it('resolveSignInPath routes admin destinations to admin sign-in', () => {
    expect(resolveSignInPath('/admin/games')).toBe(
      '/admin/sign-in?redirect_url=%2Fadmin%2Fgames',
    );
  });

  it('resolveSignInPath routes user destinations to storefront sign-in', () => {
    expect(resolveSignInPath('/my-games')).toBe(
      '/sign-in?redirect_url=%2Fmy-games',
    );
    expect(resolveSignInPath()).toBe('/sign-in');
  });

  it('resolvePostAuthPath sends admins to admin frontend', () => {
    expect(resolvePostAuthPath({ role: 'admin' })).toBe('/admin');
    expect(resolvePostAuthPath({ role: 'admin' }, '/admin/games')).toBe(
      '/admin/games',
    );
  });

  it('resolvePostAuthPathForRole sends non-admins to storefront', () => {
    expect(resolvePostAuthPathForRole('user')).toBe('/my-games');
    expect(resolvePostAuthPathForRole('user', '/admin')).toBe('/my-games');
  });
});
