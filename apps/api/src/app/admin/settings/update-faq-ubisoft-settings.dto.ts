import { BadRequestException } from '@nestjs/common';

export type UpdateFaqUbisoftSettingsBody = {
  method1VideoUrl?: string | null;
  method2VideoUrl?: string | null;
  lockerDownloadUrl?: string | null;
  lockerGithubUrl?: string | null;
};

function parseOptionalString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string or null`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseUpdateFaqUbisoftSettingsBody(
  body: UpdateFaqUbisoftSettingsBody,
): UpdateFaqUbisoftSettingsBody {
  const parsed: UpdateFaqUbisoftSettingsBody = {};

  if ('method1VideoUrl' in body) {
    parsed.method1VideoUrl = parseOptionalString(
      body.method1VideoUrl,
      'method1VideoUrl',
    );
  }

  if ('method2VideoUrl' in body) {
    parsed.method2VideoUrl = parseOptionalString(
      body.method2VideoUrl,
      'method2VideoUrl',
    );
  }

  if ('lockerDownloadUrl' in body) {
    parsed.lockerDownloadUrl = parseOptionalString(
      body.lockerDownloadUrl,
      'lockerDownloadUrl',
    );
  }

  if ('lockerGithubUrl' in body) {
    parsed.lockerGithubUrl = parseOptionalString(
      body.lockerGithubUrl,
      'lockerGithubUrl',
    );
  }

  return parsed;
}
