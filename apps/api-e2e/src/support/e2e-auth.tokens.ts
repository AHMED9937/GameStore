import type { AuthUser } from '@gamestore/api/auth';

export const E2E_TOKENS = {
  admin: 'e2e-test-admin',
  userA: 'e2e-test-user-a',
  userB: 'e2e-test-user-b',
} as const;

const e2eUsers = new Map<string, AuthUser>();

export function registerE2eUser(token: string, user: AuthUser): void {
  e2eUsers.set(token, user);
}

export function resolveE2eUser(token: string): AuthUser | undefined {
  return e2eUsers.get(token);
}

export function clearE2eUsers(): void {
  e2eUsers.clear();
}

export function bearerToken(token: string): string {
  return `Bearer ${token}`;
}
