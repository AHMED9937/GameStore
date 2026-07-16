import { BadRequestException } from '@nestjs/common';
import {
  computeEndsAt,
  computeSalePrice,
  isValidDiscountDuration,
} from '@gamestore/shared/pricing';

export type ParsedUpsertGameDiscountBody = {
  percentOff: number;
  durationDays: number;
  durationHours: number;
  showCountdown: boolean;
  enabled: boolean;
};

function parseNonNegativeInt(
  value: unknown,
  field: string,
  { required }: { required: boolean },
): number | null {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new BadRequestException(`${field} is required`);
    }
    return null;
  }
  const parsed =
    typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BadRequestException(`${field} must be a non-negative integer`);
  }
  return parsed;
}

function parseBoolean(value: unknown, field: string, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  throw new BadRequestException(`${field} must be a boolean`);
}

export function parseUpsertGameDiscountBody(
  body: Record<string, unknown>,
  priceBase: number | string,
): ParsedUpsertGameDiscountBody {
  const percentOff = parseNonNegativeInt(body.percentOff, 'percentOff', {
    required: true,
  });
  if (percentOff === null || percentOff < 1 || percentOff > 100) {
    throw new BadRequestException('percentOff must be an integer from 1 to 100');
  }

  const durationDays =
    parseNonNegativeInt(body.durationDays, 'durationDays', { required: false }) ??
    0;
  const durationHours =
    parseNonNegativeInt(body.durationHours, 'durationHours', {
      required: false,
    }) ?? 0;

  if (!isValidDiscountDuration({ days: durationDays, hours: durationHours })) {
    throw new BadRequestException(
      'duration must include at least one day or hour greater than zero',
    );
  }

  const showCountdown = parseBoolean(body.showCountdown, 'showCountdown', true);
  const enabled = parseBoolean(body.enabled, 'enabled', true);

  const sale = computeSalePrice(priceBase, percentOff);
  if (!Number.isFinite(sale) || sale < 0) {
    throw new BadRequestException(
      'percentOff must leave a sale price of zero or greater',
    );
  }

  // Validate duration produces a future end (and that helpers agree).
  const endsAt = computeEndsAt(new Date(), {
    days: durationDays,
    hours: durationHours,
  });
  if (!(endsAt.getTime() > Date.now())) {
    throw new BadRequestException('discount duration must end in the future');
  }

  return {
    percentOff,
    durationDays,
    durationHours,
    showCountdown,
    enabled,
  };
}
