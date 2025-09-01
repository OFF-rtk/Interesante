import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec } from 'child_process';
import { VideoKeyframe } from 'src/database/entities/video-keyframe.entity';
import { VideoMetadata } from 'src/database/entities/video-metadata.entity';
import { VideoProcessing } from 'src/database/entities/video-processing.entity';
import { DeepPartial, Repository } from 'typeorm';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

const execAsync = promisify(exec);

interface YtDlpJson {
    title?: string;
    description?: string;
    duration?: number;
    uploader?: string;
    thumbnail?: string;
    view_count?: number;
    upload_date?: string;
}
  
interface FfprobeStream {
    codec_type?: string; // "video", "audio", etc.
    width?: number;
    height?: number;
}

interface FfprobeData {
    streams: FfprobeStream[];
}
  
interface AdvancedHashResult {
    phash: string;
    dct_hash: string;
    clip_embedding: number[] | null;
    advanced_features: {
        brightness: number;
        contrast: number;
        complexity: number;
        dominant_colors: number[][];
        edge_density: number;
        texture_energy?: number;
    } | null;
    success: boolean;
    error?: string;
}

interface EnhancedFrameHashResult {
    framePath: string;
    timestamp: number;
    hashData: AdvancedHashResult;
    width: number;
    height: number;
}

// src/types/hash-result.interface.ts
export interface AiServiceResponse {
    success: boolean;
    phash?: string;
    dct_hash?: string;
    tf_embedding?: number[]; // or Float32Array depending on your AI service
    advanced_features: {
        brightness: number;
        contrast: number;
        complexity: number;
        dominant_colors: number[][];
        edge_density: number;
        texture_energy?: number;
    } | null; // can refine if you know exact structure
    error?: string;
}
  
  
    
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}



@Injectable()
export class ProcessingAgentService {
    private readonly logger = new Logger('🎬 ProcessingAgent');
    
    constructor(
        @InjectRepository(VideoProcessing)
        private videoProcessingRepo: Repository<VideoProcessing>,

        @InjectRepository(VideoMetadata)
        private videoMetadataRepo: Repository<VideoMetadata>,

        @InjectRepository(VideoKeyframe)
        private videoKeyframeRepo: Repository<VideoKeyframe>,
        private readonly configService: ConfigService,
    ) { }
    
    startProcessing(videoProcessingId: string): void {
        this.logger.log(`Starting processing for job: ${videoProcessingId}`);

        setImmediate(() => {
            this.processVideo(videoProcessingId).catch(error => {
                this.logger.log(`❌ Background processing failed: ${getErrorMessage(error)}`)
                void this.updateJobError(videoProcessingId, getErrorMessage(error))
            });
        })
    }

    private async processVideo(videoProcessingId: string): Promise<void> {
        try {
            const job = await this.videoProcessingRepo.findOne({
                where: { id: videoProcessingId }
            });

            if (!job) {
                throw new Error(`Job ${videoProcessingId} not found`);
            }

            this.logger.log(`📝 Processing: ${job.youtubeUrl}`);

            await this.updateJobStatus(videoProcessingId, 'processing', 10);
            const videoId = this.extractYouTubeVideoId(job.youtubeUrl);
            await this.extractVideoMetadata(job.youtubeUrl, videoProcessingId);

            await this.updateJobStatus(videoProcessingId, 'processing', 25);
            const videoPath = await this.downloadVideo(videoId);

            await this.updateJobStatus(videoProcessingId, 'processing', 45);
            const keyframes = await this.extractKeyframes(videoPath, videoId);

            await this.updateJobStatus(videoProcessingId, 'processing', 70);
            const processedKeyframes = await this.generatePerceptualHashes(keyframes, videoProcessingId);
        
            await this.updateJobStatus(videoProcessingId, 'processing', 85);
            await this.saveKeyframesToDatabase(processedKeyframes, videoProcessingId);

            await this.cleanupTemporaryFiles(videoPath, keyframes);
            await this.updateJobStatus(videoProcessingId, 'detection', 95);
            await this.updateJobFrameCount(videoProcessingId, processedKeyframes.length);
            
            this.logger.log(`✅ Processing complete: ${processedKeyframes.length} keyframes processed`);
        } catch (error) {
            this.logger.error(`❌ Processing failed: ${getErrorMessage(error)}`);
            await this.updateJobError(videoProcessingId, getErrorMessage(error));
        }
    }
    
    private extractYouTubeVideoId(url: string): string {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);

        if (!match) {
            throw new Error('Invalid YouTube URL - could not extract video ID');
        }

        return match[1];
    }

    private async extractVideoMetadata(youtubeUrl: string, videoProcessingId: string): Promise<VideoMetadata> {
        this.logger.log(`📊 Extracting metadata...`);

        try {
            const { stdout } = await execAsync(`yt-dlp --dump-json "${youtubeUrl}"`);
            const ytData: YtDlpJson = JSON.parse(stdout) as YtDlpJson;

            const metadata = this.videoMetadataRepo.create({
                videoProcessing: {id: videoProcessingId} as VideoProcessing,
                youtubeVideoId: this.extractYouTubeVideoId(youtubeUrl),
                title: ytData.title?.substring(0, 255) || 'Unknown Title',
                description: ytData.description?.substring(0, 1000) || null,
                durationSeconds: ytData.duration || null,
                channelName: ytData.uploader?.substring(0, 100) || null,
                thumbnailUrl: ytData.thumbnail || null,
                viewCount: ytData.view_count || null,
                publishDate: ytData.upload_date ? this.parseUploadDate(ytData.upload_date) : null,
            } as DeepPartial<VideoMetadata>);

            const savedMetadata = await this.videoMetadataRepo.save(metadata);

            await this.videoProcessingRepo.update(videoProcessingId, {
                videoTitle: ytData.title?.substring(0, 255) ?? 'Unknown Title'
            });

            this.logger.log(`✅ Metadata saved: "${ytData.title}"`)
            return savedMetadata;
        } catch (error) {
            this.logger.error(`Failed to extract metadata: ${getErrorMessage(error)}`);
            throw new Error(`Metadata extraction failed: ${getErrorMessage(error)}`);
        }
    }
    
    private parseUploadDate(dateString: string): Date | null {
        try {
            if (dateString && dateString.length === 8) {
                const year = dateString.substring(0, 4);
                const month = dateString.substring(4, 6);
                const day = dateString.substring(6, 8);
                return new Date(`${year}-${month}-${day}`);
            }
            return null;
        } catch {
            return null;
        }
    }
    
    private async downloadVideo(videoId: string): Promise<string> {
        this.logger.log(`⬇️ Downloading video: ${videoId}`);
        const tempDir = '/tmp/video-processing';
        const videoPath = path.join(tempDir, `${videoId}.%(ext)s`);
        await fs.promises.mkdir(tempDir, { recursive: true });

        try {
            const command = `yt-dlp -f "best[height<=720]/best" -o "${videoPath}" "https://youtube.com/watch?v=${videoId}"`;
            await execAsync(command);

            const files = await fs.promises.readdir(tempDir);
            const downloadedFile = files.find(f => f.startsWith(videoId));

            if (!downloadedFile) {
                throw new Error('Downloaded video file not found');
            }

            const actualPath = path.join(tempDir, downloadedFile);
            this.logger.log(`✅ Video downloaded: ${actualPath}`);
            return actualPath;
        } catch (error) {
            this.logger.error(`Download failed: ${getErrorMessage(error)}`);
            throw new Error(`Video download failed: ${getErrorMessage(error)}`);
        }
    }

    private async extractKeyframes(videoPath: string, videoId: string): Promise<string[]> {
        this.logger.log(`🎞️ Extracting keyframes from: ${path.basename(videoPath)}`);

        const framesDir = path.join('/tmp/video-processing', `${videoId}_frames`);
        await fs.promises.mkdir(framesDir, { recursive: true });

        try {
            const command = `ffmpeg -i "${videoPath}" -vf fps=1/3 -y "${framesDir}/frame_%04d.jpg"`;
            await execAsync(command);

            const frameFiles = await fs.promises.readdir(framesDir);
            const framePaths = frameFiles.filter(f => f.endsWith('.jpg')).sort().map(f => path.join(framesDir, f));
        
            this.logger.log(`✅ Extracted ${framePaths.length} keyframes`);
            return framePaths;
        } catch (error) {
            this.logger.error(`Frame extraction failed: ${getErrorMessage(error)}`);
            throw new Error(`Keyframe extraction failed: ${getErrorMessage(error)}`);
        }
    }
    
    private async generatePerceptualHashes(framePaths: string[], videoProcessingId: string): Promise<EnhancedFrameHashResult[]> {
        this.logger.log(`🧠 Generating AI-enhanced perceptual hashes for ${framePaths.length} frames`)
        const processedFrames: EnhancedFrameHashResult[] = [];

        const batchSize = 3;
        let successCount = 0;
        let fallbackCount = 0;

        for (let i = 0; i < framePaths.length; i += batchSize) {
            const batch = framePaths.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async (framePath, index) => {
                    const frameIndex = i + index;
                    const timestamp = frameIndex * 3;

                    const hashData = await this.generateFrameHash(framePath);
                    const dimensions = await this.getFrameDimensions(framePath);

                    if (hashData.success) {
                        successCount++;
                    } else {
                        fallbackCount++;
                    }
                    return {
                        framePath,
                        timestamp,
                        hashData,
                        width: dimensions.width,
                        height: dimensions.height,
                    };
                })
            );             

            processedFrames.push(...batchResults);

            const progress = Math.min(70 + (i / framePaths.length) * 15, 85);
            await this.updateJobStatus(videoProcessingId, 'processing', Math.floor(progress));

            if (i + batchSize < framePaths.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        this.logger.log(
            `✅ Generated ${processedFrames.length} perceptual hashes (success: ${successCount}, fallback: ${fallbackCount})`
        ); 
        
        return processedFrames;
    }

    private async generateFrameHash(framePath: string): Promise<AdvancedHashResult> {
        try {
            const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://ai-service-5000');

            const response = await fetch(`${aiServiceUrl}/generate-hash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_path: framePath,
                }),
                signal: AbortSignal.timeout(30000),
            });

            if (!response.ok) {
                throw new Error(`AI service responded with status ${response.status}`);
            }

            const result: AiServiceResponse = await response.json() as AiServiceResponse;

            if (!result.success || !result.phash || !result.dct_hash) {
                this.logger.warn(`AI service failed for ${framePath}: ${result.error || 'Unknown error'}`);
                return await this.generateFallbackHash(framePath);
            }
            
            if (Math.random() < 0.1) {
                this.logger.log(`🎯 AI service success: pHash=${result.phash.substring(0, 8)}...`)
            }

            return {
                phash: result.phash,
                dct_hash: result.dct_hash,
                clip_embedding: result.tf_embedding || null,
                advanced_features: result.advanced_features || null,
                success: true,
            };
        } catch (error) {
            this.logger.warn(
                `AI service call failed for ${path.basename(framePath)} : ${getErrorMessage(error)}`,
            );
            return await this.generateFallbackHash(framePath);
        }
    }

    private async generateFallbackHash(
        framePath: string
    ): Promise<AdvancedHashResult> {
        try {
            const buffer: Buffer = await fs.promises.readFile(framePath);
            const hex: string = crypto.createHash('sha256').update(buffer).digest('hex');
            const short = hex.slice(0, 16);
      
            return {
                phash: short,
                dct_hash: short,
                clip_embedding: null,
                advanced_features: null,
                success: true
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
      
            return {
                phash: `error_hash_${Math.random().toString(36).slice(2, 10)}`,
                dct_hash: `error_hash_${Math.random().toString(36).slice(2, 10)}`,
                clip_embedding: null,
                advanced_features: null,
                success: false,
                error: message
            };
        }
    }

    private async getFrameDimensions(imagePath: string): Promise<{ width: number, height: number }> {
        try {
            const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_streams "${imagePath}"`);
            const data: FfprobeData = JSON.parse(stdout) as FfprobeData;
            const videoStream = data.streams.find(s => s.codec_type === 'video');

            return {
                width: videoStream?.width || 1280,
                height: videoStream?.height || 720
            };
        } catch {
            return { width: 1280, height: 720 };
        }
    }

    private async saveKeyframesToDatabase(processedFrames: EnhancedFrameHashResult[], videoProcessingId: string): Promise<void> {
        this.logger.log(`💾 Saving ${processedFrames.length} keyframes to database`);

        const keyframes = processedFrames.map(frame =>
            this.videoKeyframeRepo.create({
                videoProcessing: { id: videoProcessingId } as VideoProcessing,
                frameTimestamp: frame.timestamp,
                perceptualHash: frame.hashData.phash,
                dctHash: frame.hashData.dct_hash,
                clipEmbedding: frame.hashData.clip_embedding,
                advancedFeatures: frame.hashData.advanced_features,
                frameWidth: frame.width,
                frameHeight: frame.height,
                framePath: null
            } as DeepPartial<VideoProcessing>)
        );

        await this.videoKeyframeRepo.save(keyframes);
        this.logger.log(`✅ Saved ${keyframes.length} keyframes to database`);
    }

    private async cleanupTemporaryFiles(videoPath: string, framePaths: string[]): Promise<void> {
        try {
            if (await this.fileExists(videoPath)) {
                await fs.promises.unlink(videoPath);
                this.logger.log(`🗑️ Deleted video: ${path.basename(videoPath)}`)
            }
            if (framePaths.length > 0) {
                const framesDir = path.dirname(framePaths[0]);
                await fs.promises.rmdir(framesDir, { recursive: true });
                this.logger.log(`🗑️ Deleted frames directory: ${path.basename(framesDir)}`);
            }
        } catch (error) {
            this.logger.warn(`Cleanup warning: ${getErrorMessage(error)}`);
        }
    }

    private async fileExists(filepath: string): Promise<boolean> {
        try {
            await fs.promises.access(filepath);
            return true;
        } catch {
            return false;
        }
    }

    private async updateJobStatus(id: string, status: string, progressPercent: number): Promise<void> {
        await this.videoProcessingRepo.update(id, { status, progressPercent });
        this.logger.log(`📊 Job ${id}: ${status} (${progressPercent}%)`);
    }
    
    private async updateJobFrameCount(id: string, frameCount: number): Promise<void> {
        await this.videoProcessingRepo.update(id, { totalFramesExtracted: frameCount });
    }

    private async updateJobError(id: string, error: string): Promise<void> {
        await this.videoProcessingRepo.update(id, { 
          status: 'failed', 
          progressPercent: 0,
          processingError: error.substring(0, 500)
        });
        this.logger.error(`❌ Job ${id} failed: ${error}`);
    }
}
