import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string; // 'CERTIFICATE_CREATED', 'CERTIFICATE_REVOKED', 'FRAUD_REPORTED', etc.

  @Column()
  resourceType: string; // 'CERTIFICATE', 'FRAUD_REPORT', 'USER'

  @Column()
  resourceId: string;

  @Column({ type: 'json' })
  metadata: {
    ipAddress: string;
    userAgent: string;
    previousState?: unknown;
    newState?: unknown;
    reason?: string;
  };

  @Column({ default: 'INFO' })
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

  @CreateDateColumn()
  createdAt: Date;
}
