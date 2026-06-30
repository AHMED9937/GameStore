import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from '@gamestore/api/data-access';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogs: AuditLogsRepository) {}

  list(query: { page?: number; limit?: number; action?: string }) {
    return this.auditLogs.findPaginated(query);
  }
}
