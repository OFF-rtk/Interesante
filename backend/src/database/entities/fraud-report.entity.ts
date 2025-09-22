import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('fraud_reports')
export class FraudReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reportedCertificateId: string;

  @Column()
  reporterUserId: string;

  @Column()
  reporterEmail: string;

  @Column()
  reporterName: string;

  @Column('text')
  fraudDescription: string;

  @Column({ type: 'json' })
  evidence: {
    originalUploadDate?: Date;
    originalPlatform?: string;
    originalUrl?: string;
    socialProof?: string;
    additionalEvidence?: string[];
    reporterIpAddress: string;
  };

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'INVESTIGATING';

  @Column({ type: 'json', nullable: true })
  investigation: {
    investigatedBy?: string;
    investigatedAt?: Date;
    findings?: string;
    action?: string;
  };

  @Column({ default: 'LOW' })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
