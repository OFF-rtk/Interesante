import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  certificateId: string;

  @Column()
  userId: string;

  @Column()
  originalFilename: string;

  @Column('bigint')
  fileSize: number;

  @Column()
  sha256Hash: string;

  @Column('decimal', { precision: 10, scale: 2 })
  videoDuration: number;

  @Column('json')
  contentHashes: unknown[];

  @Column('json')
  technicalMetadata: unknown;

  @Column()
  certificateHash: string;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'REVOKED' | 'DISPUTED';

  // 🆕 LEGAL COMPLIANCE FIELDS
  @Column({ type: 'json' })
  userAgreement: {
    tosVersion: string;
    acceptedAt: Date;
    userOwnershipWarranty: boolean;
    platformDisclaimerAccepted: boolean;
    ipAddress: string;
    userAgent: string;
  };

  @Column({ default: 'TECHNICAL_EVIDENCE_ONLY' })
  certificateType: 'TECHNICAL_EVIDENCE_ONLY';

  @Column({ type: 'text', nullable: true })
  revocationReason: string;

  @Column({ type: 'uuid', nullable: true })
  revokedByUserId: string;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
