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

    @Column({
        type: 'enum',
        enum: ['intake', 'processing', 'detection', 'completed', 'failed'],
        default: 'intake',
    })
    status: string;

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
} 
