import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn,
    OneToMany,
    OneToOne
} from 'typeorm';
import { VideoKeyframe } from './video-keyframe.entity';
import { VideoMetadata } from './video-metadata.entity';
import { SuspectVideo } from './suspect-video.entity';

// ✅ Define proper TypeScript enum for all status values
export enum VideoProcessingStatus {
    INTAKE = 'intake',
    PROCESSING = 'processing',
    DETECTION = 'detection',
    SEARCHING = 'searching',        // ← Added for Detective Agent
    EXTRACTING = 'extracting',      // ← Added for Detective Agent
    ANALYZING = 'analyzing',        // ← Added for Detective Agent
    COMPILING = 'compiling',        // ← Added for Detective Agent
    COMPLETED = 'completed',
    FAILED = 'failed'
}

@Entity('video_processing')
export class VideoProcessing {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: 'varchar' })
    youtubeUrl: string;

    @Column({ type:'varchar', nullable: true })
    videoTitle?: string;

    // ✅ Updated to use TypeScript enum instead of inline array
    @Column({
        type: 'enum',
        enum: VideoProcessingStatus,
        default: VideoProcessingStatus.INTAKE,
    })
    status: VideoProcessingStatus;  // ← Changed from string to enum type

    @Column({ type: 'int', nullable: true })
    etaMinutes?: number;

    @Column({ type: 'int', nullable: true })
    totalFramesExtracted?: number;

    @Column({ type: 'varchar', nullable: true })
    processingError?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'int', default: 0 })
    progressPercent: number;

    @OneToMany(() => VideoKeyframe, keyframe => keyframe.videoProcessing)
    keyframes: VideoKeyframe[];

    @OneToOne(() => VideoMetadata, metadata => metadata.videoProcessing)
    metadata: VideoMetadata;

    @OneToMany(() => SuspectVideo, suspect => suspect.videoProcessing)
    suspectVideos: SuspectVideo[];
}
