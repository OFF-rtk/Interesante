import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { VideoProcessing } from "./video-processing.entity";

@Entity('video_metadata')
export class VideoMetadata {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    videoProcessingId: string;

    @Column({ type: 'varchar', length: 11 })
    youtubeVideoId: string;

    @Column({ type: 'varchar', nullable: true })
    title?: string;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @Column({ type: 'int', nullable: true })
    durationSeconds?: number;

    @Column({ type: 'varchar', nullable: true })
    channelName?: string;

    @Column({ type: 'varchar', nullable: true })
    thumbnailUrl?: string;

    @Column({ type: 'bigint', nullable: true })
    viewCount?: number;

    @Column({ type: 'timestamp', nullable: true })
    publishDate?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @OneToOne(() => VideoProcessing)
    @JoinColumn({ name: 'videoProcessingId' })
    videoProcessing: VideoProcessing;
}