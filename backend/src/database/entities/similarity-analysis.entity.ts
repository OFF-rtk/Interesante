import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('similarity_analyses')
export class SimilarityAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  analysisId: string;

  @Column()
  userId: string;

  @Column()
  originalFilename: string;

  @Column()
  suspectedFilename: string;

  @Column()
  originalSha256: string;

  @Column()
  suspectedSha256: string;

  @Column('decimal', { precision: 5, scale: 4 })
  visualSimilarity: number;

  @Column('decimal', { precision: 5, scale: 4 })
  temporalAlignment: number;

  @Column('decimal', { precision: 5, scale: 4 })
  overallConfidence: number;

  @Column('json')
  matchedFrames: any[];

  @Column('json')
  analysisMetadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
