import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from "typeorm";
import { VideoProcessing } from "./video-processing.entity";

@Entity('video_keyframes')
@Index(['videoProcessingId', 'frameTimestamp'])
@Index(['perceptualHash'])
export class VideoKeyframe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    videoProcessingId: string;

    @ManyToOne(() => VideoProcessing)
    videoProcessing: VideoProcessing;

    @Column({ type: 'int' })
    frameTimestamp: number;

    @Column({ type: 'varchar', length: 64 })
    perceptualHash: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    dctHash: string;

    @Column({ type: 'json', nullable: true })
    clipEmbedding: number[];

    @Column({ type: 'json', nullable: true })
    advancedFeatures: {
        brightness: number;
        contrast: number;
        complexity: number;
        dominant_colors: number[][];
        edge_density: number;
        texture_energy?: number;
    };

    @Column({ type: 'integer' })
    frameWidth: number;

    @Column({ type: 'integer' })
    frameHeight: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    framePath: string;

    @CreateDateColumn()
    createdAt: Date;
}