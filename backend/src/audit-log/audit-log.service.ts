import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: {
    ipAddress: string;
    userAgent: string;
    previousState?: unknown;
    newState?: unknown;
    reason?: string;
    [key: string]: unknown;
  };
  level?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(logData: CreateAuditLogDto) {
    return this.auditLogRepository.save({
      ...logData,
      level: logData.level || 'INFO',
    });
  }

  async getUserLogs(userId: string, limit: number = 50) {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getResourceLogs(resourceType: string, resourceId: string) {
    return this.auditLogRepository.find({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCriticalLogs(limit: number = 100) {
    return this.auditLogRepository.find({
      where: { level: 'CRITICAL' },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
