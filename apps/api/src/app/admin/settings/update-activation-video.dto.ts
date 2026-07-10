import { BadRequestException } from '@nestjs/common';

export type UpdateActivationVideoBody = {
  url?: string | null;
};

export function parseUpdateActivationVideoBody(
  body: UpdateActivationVideoBody,
): string | null {
  if (body.url === null || body.url === undefined) {
    return null;
  }

  if (typeof body.url !== 'string') {
    throw new BadRequestException('url must be a string or null');
  }

  const trimmed = body.url.trim();
  return trimmed.length > 0 ? trimmed : null;
}
