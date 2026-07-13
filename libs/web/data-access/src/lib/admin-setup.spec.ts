import { describe, expect, it } from 'vitest';
import { ApiError } from './api-client';
import { apiErrorMessage, isSetupResponse, isTransientApiError } from './admin-setup';

describe('admin-setup helpers', () => {
  it('isSetupResponse detects setup JSON', () => {
    expect(
      isSetupResponse({
        status: 'setup',
        integration: 'admin-games',
        message: 'Admin games not implemented yet',
      }),
    ).toBe(true);
    expect(isSetupResponse({ status: 'success' })).toBe(false);
  });

  it('apiErrorMessage maps auth errors', () => {
    expect(apiErrorMessage(new ApiError(403, 'Forbidden'))).toBe('Admin access required');
    expect(
      apiErrorMessage(
        new ApiError(
          403,
          JSON.stringify({ message: 'Sign in with the account used to purchase' }),
        ),
      ),
    ).toBe('Sign in with the account used to purchase');
    expect(apiErrorMessage(new ApiError(401, 'Unauthorized'))).toBe('Sign in required');
  });

  it('apiErrorMessage parses BFF error JSON', () => {
    expect(
      apiErrorMessage(
        new ApiError(
          503,
          JSON.stringify({ error: 'Upstream API unavailable. Start Nest with: pnpm nx serve api' }),
        ),
      ),
    ).toBe('Upstream API unavailable. Start Nest with: pnpm nx serve api');
  });

  it('apiErrorMessage maps transient HTTP statuses to friendly copy', () => {
    expect(apiErrorMessage(new ApiError(503, '{}'))).toBe(
      'Server is busy or unavailable. Try again in a moment.',
    );
  });

  it('apiErrorMessage surfaces Steam decrypt mismatch from Nest 422', () => {
    expect(
      apiErrorMessage(
        new ApiError(
          422,
          JSON.stringify({
            statusCode: 422,
            message:
              'Unable to decrypt Steam credentials. STEAM_ENCRYPTION_KEY on this server must match the key used when accounts were saved.',
            error: 'Unprocessable Entity',
          }),
        ),
      ),
    ).toMatch(/STEAM_ENCRYPTION_KEY/);
  });

  it('isTransientApiError detects retryable failures', () => {
    expect(isTransientApiError(new ApiError(503, 'busy'))).toBe(true);
    expect(isTransientApiError(new ApiError(404, 'missing'))).toBe(false);
    expect(
      isTransientApiError(new DOMException('signal is aborted without reason', 'AbortError')),
    ).toBe(true);
  });

  it('apiErrorMessage maps abort errors to timeout copy', () => {
    expect(
      apiErrorMessage(new DOMException('signal is aborted without reason', 'AbortError')),
    ).toBe('Request timed out. Try again.');
  });
});
