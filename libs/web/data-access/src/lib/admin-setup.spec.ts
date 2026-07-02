import { describe, expect, it } from 'vitest';
import { ApiError } from './api-client';
import { apiErrorMessage, isSetupResponse } from './admin-setup';

describe('admin-setup helpers', () => {
  it('isSetupResponse detects setup JSON', () => {
    expect(
      isSetupResponse({
        status: 'setup',
        integration: 'admin-games',
        message: 'Admin games — not implemented yet',
      }),
    ).toBe(true);
    expect(isSetupResponse({ status: 'success' })).toBe(false);
  });

  it('apiErrorMessage maps auth errors', () => {
    expect(apiErrorMessage(new ApiError(403, 'Forbidden'))).toBe('Admin access required');
    expect(apiErrorMessage(new ApiError(401, 'Unauthorized'))).toBe('Sign in required');
  });

  it('apiErrorMessage maps abort errors to timeout copy', () => {
    expect(
      apiErrorMessage(new DOMException('signal is aborted without reason', 'AbortError')),
    ).toBe('Request timed out. Try again.');
  });
});
