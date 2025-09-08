import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VideoProcessing, VideoProcessingStatus } from "src/database/entities/video-processing.entity"; // ✅ Import enum

@Injectable()
export class IntakeAgentService {
    private readonly logger = new Logger('🤖 IntakeAgent');

    constructor(
        @InjectRepository(VideoProcessing)
        private videoProcessingRepo: Repository<VideoProcessing>,
    ) { }
    
    async validateAndQueue(userId: string, youtubeUrl: string): Promise<VideoProcessing> {
        this.logger.log(`Intake Agent: Processing YouTube URL for user ${userId}`);

        if (!this.isValidYouTubeUrl(youtubeUrl)) {
            throw new BadRequestException('❌ Invalid YouTube URL format')
        }

        const processing = this.videoProcessingRepo.create({
            userId: userId,
            youtubeUrl: youtubeUrl,
            status: VideoProcessingStatus.INTAKE, // ✅ Use enum instead of 'intake' string
            progressPercent: 5,
            etaMinutes: 25
        });

        const savedRecord = await this.videoProcessingRepo.save(processing);

        this.logger.log(`✅ Video queued successfully with ID: ${savedRecord.id}`);

        return savedRecord;
    }
    
    private isValidYouTubeUrl(url: string): boolean {
        const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/
        return ytRegex.test(url);
    }

    async getAllProcessingJobs(): Promise<VideoProcessing[]> {
        return this.videoProcessingRepo.find({
            order: { createdAt: 'DESC' }
        });
    }

    async getJobById(id: string): Promise<VideoProcessing> {
        const job = await this.videoProcessingRepo.findOne({
            where: { id }
        });
        if (!job) {
            throw new BadRequestException(`Job with ID ${id} not found`); 
        }
        return job;
    }
 }
