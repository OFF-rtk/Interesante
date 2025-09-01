import { Controller, Post, Param, Get, HttpStatus, Logger, HttpException } from '@nestjs/common';
import { ProcessingAgentService } from './processing-agent.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoProcessing } from '../../database/entities/video-processing.entity';
import { VideoMetadata } from '../../database/entities/video-metadata.entity';
import { VideoKeyframe } from '../../database/entities/video-keyframe.entity';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

@Controller('processing-agent')
export class ProcessingAgentController {
  private readonly logger = new Logger('🎬 ProcessingAgentController');

  constructor(
    private readonly processingService: ProcessingAgentService,
    
    @InjectRepository(VideoProcessing)
    private videoProcessingRepo: Repository<VideoProcessing>,
    
    @InjectRepository(VideoMetadata)
    private videoMetadataRepo: Repository<VideoMetadata>,
    
    @InjectRepository(VideoKeyframe)
    private videoKeyframeRepo: Repository<VideoKeyframe>,
  ) {}

  @Post('start/:videoProcessingId')
  async startProcessing(
    @Param('videoProcessingId') videoProcessingId: string
  ): Promise<{ 
    message: string; 
    caseId: string; 
    status: string; 
    estimatedTime: string; 
  }> {
    this.logger.log(`🚀 Processing request received for job: ${videoProcessingId}`);

    try {
      // Validate job exists and is in correct status
      const job = await this.videoProcessingRepo.findOne({
        where: { id: videoProcessingId }
      });

      if (!job) {
        this.logger.error(`❌ Job not found: ${videoProcessingId}`);
        throw new HttpException(
          `Processing job ${videoProcessingId} not found`,
          HttpStatus.NOT_FOUND
        );
      }

      if (job.status !== 'intake') {
        this.logger.error(`❌ Job not ready for processing: ${videoProcessingId} (status: ${job.status})`);
        throw new HttpException(
          `Job ${videoProcessingId} is not ready for processing (current status: ${job.status})`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Start processing asynchronously
      this.processingService.startProcessing(videoProcessingId);

      this.logger.log(`✅ Processing started successfully for job: ${videoProcessingId}`);

      return {
        message: 'Video processing started successfully',
        caseId: videoProcessingId,
        status: 'processing',
        estimatedTime: '15-30 minutes'
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Failed to start processing: ${getErrorMessage(error)}`);
      throw new HttpException(
        'Failed to start video processing',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status/:videoProcessingId')
  async getProcessingStatus(
    @Param('videoProcessingId') videoProcessingId: string
  ): Promise<{
    caseId: string;
    status: string;
    progressPercent: number;
    videoTitle?: string;
    totalFramesExtracted?: number;
    processingError?: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    this.logger.log(`📊 Status request for job: ${videoProcessingId}`);

    try {
      const job = await this.videoProcessingRepo.findOne({
        where: { id: videoProcessingId }
      });

      if (!job) {
        throw new HttpException(
          `Processing job ${videoProcessingId} not found`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        caseId: job.id,
        status: job.status,
        progressPercent: job.progressPercent,
        videoTitle: job.videoTitle,
        totalFramesExtracted: job.totalFramesExtracted,
        processingError: job.processingError,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Failed to get status: ${getErrorMessage(error)}`);
      throw new HttpException(
        'Failed to retrieve processing status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metadata/:videoProcessingId')
  async getVideoMetadata(
    @Param('videoProcessingId') videoProcessingId: string
  ): Promise<{
    youtubeVideoId: string;
    title: string;
    description?: string;
    durationSeconds?: number;
    channelName?: string;
    thumbnailUrl?: string;
    viewCount?: number;
    publishDate?: Date;
  }> {
    this.logger.log(`📋 Metadata request for job: ${videoProcessingId}`);

    try {
      const metadata = await this.videoMetadataRepo.findOne({
        where: { videoProcessing: { id: videoProcessingId } }
      });

      if (!metadata) {
        throw new HttpException(
          `Metadata for job ${videoProcessingId} not found`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        youtubeVideoId: metadata.youtubeVideoId,
        title: metadata.title ?? 'Untitled Video',
        description: metadata.description,
        durationSeconds: metadata.durationSeconds,
        channelName: metadata.channelName,
        thumbnailUrl: metadata.thumbnailUrl,
        viewCount: metadata.viewCount,
        publishDate: metadata.publishDate
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Failed to get metadata: ${getErrorMessage(error)}`);
      throw new HttpException(
        'Failed to retrieve video metadata',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('keyframes/:videoProcessingId')
  async getKeyframes(
    @Param('videoProcessingId') videoProcessingId: string
  ): Promise<{
    totalFrames: number;
    keyframes: Array<{
      id: string;
      frameTimestamp: number;
      perceptualHash: string;
      dctHash?: string;
      clipEmbedding?: number[];
      advancedFeatures?: any;
      frameWidth: number;
      frameHeight: number;
      createdAt: Date;
    }>;
  }> {
    this.logger.log(`🎞️ Keyframes request for job: ${videoProcessingId}`);

    try {
      const keyframes = await this.videoKeyframeRepo.find({
        where: { videoProcessing: { id: videoProcessingId } },
        order: { frameTimestamp: 'ASC' }
      });

      return {
        totalFrames: keyframes.length,
        keyframes: keyframes.map(frame => ({
          id: frame.id,
          frameTimestamp: frame.frameTimestamp,
          perceptualHash: frame.perceptualHash,
          dctHash: frame.dctHash,
          clipEmbedding: frame.clipEmbedding,
          advancedFeatures: frame.advancedFeatures,
          frameWidth: frame.frameWidth,
          frameHeight: frame.frameHeight,
          createdAt: frame.createdAt
        }))
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get keyframes: ${getErrorMessage(error)}`);
      throw new HttpException(
        'Failed to retrieve keyframes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
