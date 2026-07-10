import { describe, expect, it } from 'vitest';
import { PrismaConfig } from './prisma.config';

describe('PrismaConfig', () => {
  it('returns setup response for health', () => {
    expect(PrismaConfig.getSetupResponse('health')).toEqual({
      status: 'setup',
      integration: 'prisma',
      message: 'Prisma health not implemented yet',
    });
  });
});
