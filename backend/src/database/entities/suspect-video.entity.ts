import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VideoProcessing } from './video-processing.entity';

@Entity('suspect_videos')
export class SuspectVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 🔗 CRITICAL: Link to detection job
  @Column({ type: 'uuid' })
  videoProcessingId: string;

  @ManyToOne(() => VideoProcessing)
  @JoinColumn({ name: 'videoProcessingId' })
  videoProcessing: VideoProcessing;

  // Basic video info (keep existing)
  @Column({ unique: false }) // Remove unique constraint - same video can be detected multiple times
  youtubeVideoId: string;

  @Column()
  title: string;

  @Column()
  channelName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  viewCount: number;

  @Column({ nullable: true })
  searchQuery: string;

  // 🎯 NEW: Detection Analysis Results
  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  similarityScore: number; // Visual similarity (0-1)

  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  confidenceScore: number; // Overall confidence (0-1)

  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  temporalAlignment: number; // Temporal alignment score (0-1)

  @Column({
    type: 'enum',
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'LOW'
  })
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';

  // 🎯 NEW: Sequence Matches (JSON storage)
  @Column('json', { nullable: true })
  sequenceMatches: Array<{
    original_timestamp: number;
    suspect_timestamp: number;
    confidence: number;
    frame_matches: number;
    duration: number;
  }>;

  // 🎯 NEW: Detailed Detection Results
  @Column('json', { nullable: true })
  detectionDetails: {
    algorithm_details?: any;
    processing_time_ms?: number;
    detected_at?: string;
  };

  @Column({ default: false })
  isProcessed: boolean; // Whether analysis completed successfully

  @Column({ nullable: true })
  processingError: string; // If analysis failed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
