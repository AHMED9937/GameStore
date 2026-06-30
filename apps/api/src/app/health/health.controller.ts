import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@gamestore/api/auth';
import { PrismaService } from '@gamestore/api/prisma';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('db')
  async checkDatabase() {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Database unreachable';
      throw new HttpException(
        { status: 'error', message },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
