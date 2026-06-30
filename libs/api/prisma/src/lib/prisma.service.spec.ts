import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service';

const connect = vi.fn().mockResolvedValue(undefined);
const disconnect = vi.fn().mockResolvedValue(undefined);

vi.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    $connect = connect;
    $disconnect = disconnect;
  },
}));

describe('PrismaService', () => {
  beforeEach(() => {
    connect.mockClear();
    disconnect.mockClear();
  });

  it('connects on module init', async () => {
    const service = new PrismaService();
    await service.onModuleInit();
    expect(connect).toHaveBeenCalledOnce();
  });

  it('disconnects on module destroy', async () => {
    const service = new PrismaService();
    await service.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
