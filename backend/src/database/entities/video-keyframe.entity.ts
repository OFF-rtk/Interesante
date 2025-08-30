import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { VideoProcessing } from "./video-processing.entity";

@Entity('video_keyframes')
export class VideoKeyframe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    videoProcessingId: string;

    @Column({ type: 'int' })
    frameTimestamp: number;

    @Column({ type: 'varchar', length: 64 })
    perceptualHash: string;

    @Column({ type: 'int' })
    frameWidth: number;

    @Column({ type: 'int' })
    frameHeight: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => VideoProcessing)
    @JoinColumn({ name: 'videoProcessingId' })
    videoProcessing: VideoProcessing;
}