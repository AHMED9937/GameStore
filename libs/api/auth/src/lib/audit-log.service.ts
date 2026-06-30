import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import { writeAuditLog, type AuditLogInput } from './audit-log';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: AuditLogInput) {
    return writeAuditLog(this.prisma, input);
  }
}
