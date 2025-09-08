// src/agents/detective/detective-agent.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { VideoProcessing, VideoProcessingStatus } from '../../database/entities/video-processing.entity';
import { VideoKeyframe } from '../../database/entities/video-keyframe.entity';
import { VideoMetadata } from '../../database/entities/video-metadata.entity';
import { SuspectVideo } from '../../database/entities/suspect-video.entity';
import { YouTubeSearchService, YouTubeVideoResult } from './services/youtube-search.service';
import { CachingService } from './services/caching.service';
import {
  AiBatchAnalysisResponse,
  DetectionProgress,
  PreparedFrame,
  BatchAnalysisRequest,
  SuspectAnalysisResult,
  RiskLevel,
  DetectionStatusResponse,
  DetectionResultsResponse
} from './interfaces/detective-agent.interfaces';

// ✅ Strict interfaces for internal types
interface YouTubeSearchResult {
  readonly videoId: string;
  readonly title: string;
  readonly channelTitle: string;
  readonly publishedAt: string;
  readonly duration: string;
  readonly viewCount: number;
  readonly thumbnailUrl: string;
  readonly description: string;
}

interface SearchQuery {
  readonly query: string;
  readonly priority: number;
}

interface SuspicionMetrics {
  readonly viewCountScore: number;
  readonly uploadTimeScore: number;
  readonly titleSimilarityScore: number;
  readonly durationSimilarityScore: number;
  readonly totalScore: number;
}

interface EnhancedAnalytics {
  readonly averageConfidence: number;
  readonly topChannels: ReadonlyArray<{ readonly channel: string; readonly count: number }>;
  readonly riskDistribution: Record<RiskLevel, number>;
  readonly detectionEfficiency: number;
}

interface CachedProgressCallback {
  (processed: number, total: number): Promise<void>;
}

@Injectable()
export class DetectiveAgentService {
  private readonly logger = new Logger('🕵️ DetectiveAgent');
  
  constructor(
    @InjectRepository(VideoProcessing)
    private readonly videoProcessingRepo: Repository<VideoProcessing>,
    
    @InjectRepository(VideoKeyframe)
    private readonly videoKeyframeRepo: Repository<VideoKeyframe>,
    
    @InjectRepository(VideoMetadata)  
    private readonly videoMetadataRepo: Repository<VideoMetadata>,
    
    @InjectRepository(SuspectVideo)
    private readonly suspectVideoRepo: Repository<SuspectVideo>,
    
    private readonly configService: ConfigService,
    private readonly youTubeSearchService: YouTubeSearchService,
    private readonly cachingService: CachingService,
  ) {}

  /**
   * ✅ Start copyright detection analysis with proper error handling
   */
  public startDetection(videoProcessingId: string): void {
    this.logger.log(`🚀 Starting copyright detection for job: ${videoProcessingId}`);

    setImmediate(() => {
      this.runDetectionWorkflow(videoProcessingId).catch(async (error: unknown) => {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(`❌ Detection workflow failed: ${errorMessage}`);
        
        try {
          await this.updateJobError(videoProcessingId, errorMessage);
        } catch (updateError: unknown) {
          this.logger.error(`Failed to update job error: ${this.getErrorMessage(updateError)}`);
        }
      });
    });
  }

  /**
   * ✅ Main detection workflow with comprehensive error handling
   */
  private async runDetectionWorkflow(videoProcessingId: string): Promise<void> {
    try {
      // Phase 1: Load and validate job
      const job = await this.loadAndValidateJob(videoProcessingId);
      await this.updateProgress(videoProcessingId, {
        phase: 'searching',
        progress: 5,
        currentTask: 'Initializing detection analysis'
      });

      // Phase 2: Search for suspect videos
      const suspects = await this.searchSuspectVideos(job);
      await this.updateProgress(videoProcessingId, {
        phase: 'searching', 
        progress: 25,
        currentTask: `Found ${suspects.length} potential suspects`,
        suspectCount: suspects.length
      });

      if (suspects.length === 0) {
        await this.completeDetectionWithNoSuspects(videoProcessingId);
        return;
      }

      // Phase 3: Extract frames from suspect videos
      await this.updateProgress(videoProcessingId, {
        phase: 'extracting',
        progress: 35,
        currentTask: 'Extracting frames from suspect videos'
      });

      // Phase 4: Batch analyze suspects
      const originalFrames = this.prepareOriginalFrames(job.keyframes);
      const progressCallback: CachedProgressCallback = async (processed: number, total: number): Promise<void> => {
        const progress = 40 + (processed / total) * 35; // 40-75%
        try {
          await this.updateProgress(videoProcessingId, {
            phase: 'analyzing',
            progress: Math.floor(progress),
            currentTask: `Analyzing suspect ${processed}/${total}`,
            processedCount: processed,
            suspectCount: total
          });
        } catch (progressError: unknown) {
          this.logger.error(`Failed to update progress: ${this.getErrorMessage(progressError)}`);
        }
      };

      const analysisResults = await this.batchAnalyzeSuspects(
        originalFrames, 
        suspects,
        progressCallback
      );

      // Phase 5: Process and save results
      await this.updateProgress(videoProcessingId, {
        phase: 'compiling',
        progress: 80,
        currentTask: 'Compiling detection results'
      });

      const savedResults = await this.saveDetectionResults(videoProcessingId, analysisResults);
      
      // Phase 6: Complete detection
      await this.completeDetection(videoProcessingId, savedResults);

    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`❌ Detection workflow failed: ${errorMessage}`);
      await this.updateJobError(videoProcessingId, errorMessage);
      throw error instanceof Error ? error : new Error(`Detection workflow failed: ${errorMessage}`);
    }
  }

  /**
   * ✅ Load and validate detection job with comprehensive checks
   */
  private async loadAndValidateJob(videoProcessingId: string): Promise<VideoProcessing> {
    const job = await this.videoProcessingRepo.findOne({
      where: { id: videoProcessingId },
      relations: ['keyframes', 'metadata']
    });

    if (!job) {
      throw new Error(`Job ${videoProcessingId} not found`);
    }

    if (job.status !== VideoProcessingStatus.DETECTION) {
      throw new Error(`Job ${videoProcessingId} is not ready for detection (status: ${job.status})`);
    }

    if (!job.keyframes || job.keyframes.length === 0) {
      throw new Error(`No keyframes found for job ${videoProcessingId}`);
    }

    if (!job.metadata) {
      throw new Error(`No metadata found for job ${videoProcessingId}`);
    }

    this.logger.log(`✅ Job loaded: "${job.videoTitle}" with ${job.keyframes.length} keyframes`);
    return job;
  }

  /**
   * ✅ Search for suspect videos using real YouTube Data API
   */
  private async searchSuspectVideos(job: VideoProcessing): Promise<ReadonlyArray<YouTubeSearchResult>> {
    this.logger.log(`🔍 Searching for suspects related to "${job.videoTitle}"`);
    
    try {
      // Check cache first
      const cacheKey = `detective:search:${job.id}`;
      const cached = await this.cachingService.get<ReadonlyArray<YouTubeSearchResult>>(cacheKey);
      
      if (cached) {
        this.logger.log(`✅ Using cached search results: ${cached.length} suspects`);
        return cached;
      }

      const searchQueries = this.generateSearchQueries(job);
      const allSuspects: YouTubeSearchResult[] = [];

      // Execute searches in parallel with rate limiting
      const batchSize = 3;
      for (let i = 0; i < searchQueries.length; i += batchSize) {
        const batch = searchQueries.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (searchQuery: SearchQuery): Promise<ReadonlyArray<YouTubeSearchResult>> => {
          try {
            return await this.searchYouTubeReal(searchQuery.query);
          } catch (error: unknown) {
            this.logger.warn(`⚠️ Search failed for "${searchQuery.query}": ${this.getErrorMessage(error)}`);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allSuspects.push(...batchResults.flat());
        
        // Rate limiting delay between batches
        if (i + batchSize < searchQueries.length) {
          await this.delay(2000);
        }
      }

      // Deduplicate and filter suspects
      const uniqueSuspects = this.deduplicateAndFilterSuspects(allSuspects, job);
      
      // Cache results for 1 hour
      await this.cachingService.set(cacheKey, uniqueSuspects, 3600);
      
      this.logger.log(`🎯 Found ${uniqueSuspects.length} unique suspects after filtering`);
      return uniqueSuspects;

    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`❌ Suspect search failed: ${errorMessage}`);
      throw new Error(`Suspect search failed: ${errorMessage}`);
    }
  }

  /**
   * ✅ Generate search queries with priority scoring
   */
  private generateSearchQueries(job: VideoProcessing): ReadonlyArray<SearchQuery> {
    const queries: SearchQuery[] = [];
    const title = job.videoTitle || '';
    const channelName = job.metadata?.channelName || '';
    
    // Exact title searches (highest priority)
    if (title) {
      queries.push({ query: title, priority: 10 });
      queries.push({ query: `"${title}"`, priority: 9 });
      
      // Extract keywords from title
      const keywords = this.extractKeywords(title);
      if (keywords.length > 0) {
        queries.push({ query: keywords.slice(0, 5).join(' '), priority: 7 });
      }
    }

    // Channel-based searches
    if (channelName && title) {
      queries.push({ query: channelName, priority: 6 });
      const titleKeywords = this.extractKeywords(title);
      queries.push({ 
        query: `${channelName} ${titleKeywords.slice(0, 3).join(' ')}`, 
        priority: 8 
      });
    }

    // Description-based searches
    if (job.metadata?.description) {
      const descKeywords = this.extractKeywords(job.metadata.description);
      if (descKeywords.length > 0) {
        queries.push({ 
          query: descKeywords.slice(0, 4).join(' '), 
          priority: 5 
        });
      }
    }

    // Copyright-related searches
    if (title) {
      const baseKeywords = this.extractKeywords(title).slice(0, 3);
      queries.push({ query: `${baseKeywords.join(' ')} copy`, priority: 4 });
      queries.push({ query: `${baseKeywords.join(' ')} repost`, priority: 4 });
      queries.push({ query: `${baseKeywords.join(' ')} stolen`, priority: 3 });
    }

    return queries
      .filter((q: SearchQuery) => q.query.trim().length > 2)
      .sort((a: SearchQuery, b: SearchQuery) => b.priority - a.priority)
      .slice(0, 15); // Max 15 queries to stay within API limits
  }

  /**
   * ✅ Extract keywords from text with proper filtering
   */
  private extractKeywords(text: string): ReadonlyArray<string> {
    if (!text) return [];
    
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'video', 'youtube'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word: string) => word.length > 2 && !commonWords.has(word))
      .slice(0, 20);
  }

  /**
   * ✅ Search YouTube using real YouTube Data API
   */
  private async searchYouTubeReal(query: string): Promise<ReadonlyArray<YouTubeSearchResult>> {
    this.logger.log(`🔍 YouTube search: "${query}"`);
    
    try {
      const response = await this.youTubeSearchService.searchVideos(query, {
        maxResults: 25,
        order: 'relevance',
        safeSearch: 'none'
      });

      const results: YouTubeSearchResult[] = response.videos.map((video: YouTubeVideoResult) => ({
        videoId: video.videoId,
        title: video.title,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt,
        duration: video.duration,
        viewCount: video.viewCount,
        thumbnailUrl: video.thumbnailUrl,
        description: video.description
      }));

      this.logger.log(`✅ Found ${results.length} results for "${query}"`);
      return results;

    } catch (error: unknown) {
      this.logger.warn(`⚠️ YouTube search failed for "${query}": ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  /**
   * ✅ Deduplicate and filter suspect videos with proper typing
   */
  private deduplicateAndFilterSuspects(
    suspects: ReadonlyArray<YouTubeSearchResult>, 
    originalJob: VideoProcessing
  ): ReadonlyArray<YouTubeSearchResult> {
    // Remove duplicates by video ID
    const uniqueMap = new Map<string, YouTubeSearchResult>();
    suspects.forEach((suspect: YouTubeSearchResult) => {
      if (!uniqueMap.has(suspect.videoId)) {
        uniqueMap.set(suspect.videoId, suspect);
      }
    });

    let filtered = Array.from(uniqueMap.values());

    // Filter out the original video itself if found
    const originalVideoId = originalJob.metadata?.youtubeVideoId;
    if (originalVideoId) {
      filtered = filtered.filter((s: YouTubeSearchResult) => s.videoId !== originalVideoId);
    }

    // Filter out videos from the same channel as original
    const originalChannelName = originalJob.metadata?.channelName;
    if (originalChannelName) {
      filtered = filtered.filter((s: YouTubeSearchResult) => 
        s.channelTitle.toLowerCase() !== originalChannelName.toLowerCase()
      );
    }

    // Filter out very old videos (likely not copies)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    filtered = filtered.filter((s: YouTubeSearchResult) => new Date(s.publishedAt) > sixMonthsAgo);

    // Sort by suspicion score
    filtered.sort((a: YouTubeSearchResult, b: YouTubeSearchResult) => 
      this.calculateSuspicionScore(b, originalJob).totalScore - this.calculateSuspicionScore(a, originalJob).totalScore
    );

    return filtered.slice(0, 100);
  }

  /**
   * ✅ Calculate suspicion score with detailed metrics
   */
  private calculateSuspicionScore(suspect: YouTubeSearchResult, originalJob: VideoProcessing): SuspicionMetrics {
    let viewCountScore = 0;
    let uploadTimeScore = 0;
    let titleSimilarityScore = 0;
    let durationSimilarityScore = 0;
    
    // Lower view count = more suspicious
    if (suspect.viewCount < 1000) viewCountScore = 5;
    else if (suspect.viewCount < 10000) viewCountScore = 3;
    else if (suspect.viewCount < 100000) viewCountScore = 1;
    
    // Recent upload = more suspicious
    const daysSinceUpload = (Date.now() - new Date(suspect.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpload < 7) uploadTimeScore = 4;
    else if (daysSinceUpload < 30) uploadTimeScore = 2;
    else if (daysSinceUpload < 90) uploadTimeScore = 1;

    // Title similarity scoring
    const originalTitle = (originalJob.videoTitle || '').toLowerCase();
    const suspectTitle = suspect.title.toLowerCase();
    
    if (originalTitle && suspectTitle) {
      if (suspectTitle.includes(originalTitle) || originalTitle.includes(suspectTitle)) {
        titleSimilarityScore = 10;
      } else {
        const originalWords = this.extractKeywords(originalTitle);
        const suspectWords = this.extractKeywords(suspectTitle);
        const overlap = originalWords.filter((word: string) => suspectWords.includes(word)).length;
        titleSimilarityScore = overlap * 2;
      }
    }

    // Duration similarity
    if (originalJob.metadata?.durationSeconds && suspect.duration) {
      const originalDuration = originalJob.metadata.durationSeconds;
      const suspectDuration = this.parseDuration(suspect.duration);
      
      if (suspectDuration > 0) {
        const durationDiff = Math.abs(originalDuration - suspectDuration) / originalDuration;
        if (durationDiff < 0.1) durationSimilarityScore = 3;
        else if (durationDiff < 0.3) durationSimilarityScore = 1;
      }
    }

    const totalScore = viewCountScore + uploadTimeScore + titleSimilarityScore + durationSimilarityScore;
    
    return {
      viewCountScore,
      uploadTimeScore,
      titleSimilarityScore,
      durationSimilarityScore,
      totalScore
    };
  }

  /**
   * ✅ Parse YouTube duration format with error handling
   */
  private parseDuration(duration: string): number {
    if (!duration) return 0;
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * ✅ Prepare original frames for AI analysis with proper typing
   */
  private prepareOriginalFrames(keyframes: ReadonlyArray<VideoKeyframe>): ReadonlyArray<PreparedFrame> {
    this.logger.log(`📊 Preparing ${keyframes.length} original frames for analysis`);
    
    return keyframes
      .slice() // Create a copy to avoid mutating the original array
      .sort((a: VideoKeyframe, b: VideoKeyframe) => a.frameTimestamp - b.frameTimestamp)
      .map((frame: VideoKeyframe): PreparedFrame => ({
        timestamp: frame.frameTimestamp,
        features: {
          phash: frame.perceptualHash,
          dct_hash: frame.dctHash || '',
          tf_embedding: frame.clipEmbedding,
          advanced_features: frame.advancedFeatures || {}
        },
        width: frame.frameWidth,
        height: frame.frameHeight
      }));
  }

  /**
   * ✅ Batch analyze suspects with comprehensive caching and error handling
   */
  private async batchAnalyzeSuspects(
    originalFrames: ReadonlyArray<PreparedFrame>,
    suspects: ReadonlyArray<YouTubeSearchResult>,
    onProgress?: CachedProgressCallback
  ): Promise<ReadonlyArray<SuspectAnalysisResult>> {
    this.logger.log(`🤖 Starting batch analysis of ${suspects.length} suspects`);

    const results: SuspectAnalysisResult[] = [];
    const batchSize = 5;

    for (let i = 0; i < suspects.length; i += batchSize) {
      const batch = suspects.slice(i, i + batchSize);
      
      try {
        const batchResults = await this.processSuspectBatch(originalFrames, batch);
        results.push(...batchResults);
        
        this.logger.log(`✅ Batch ${i + 1}-${Math.min(i + batchSize, suspects.length)} completed (${batchResults.length} results)`);

      } catch (error: unknown) {
        this.logger.error(`❌ Batch analysis error: ${this.getErrorMessage(error)}`);
        // Continue with remaining batches
      }

      // Update progress
      if (onProgress) {
        await onProgress(Math.min(i + batchSize, suspects.length), suspects.length);
      }

      // Rate limiting between batches
      if (i + batchSize < suspects.length) {
        await this.delay(3000);
      }
    }

    this.logger.log(`✅ Batch analysis completed: ${results.length} results`);
    return results;
  }

  /**
   * ✅ Process a batch of suspects with caching
   */
  private async processSuspectBatch(
    originalFrames: ReadonlyArray<PreparedFrame>,
    batch: ReadonlyArray<YouTubeSearchResult>
  ): Promise<ReadonlyArray<SuspectAnalysisResult>> {
    // Check cache for batch results
    const cacheKeys = batch.map((s: YouTubeSearchResult) => `detective:analysis:${s.videoId}`);
    const cachedResults = await Promise.all(
      cacheKeys.map(async (key: string) => await this.cachingService.get<SuspectAnalysisResult>(key))
    );

    const nonCachedBatch: YouTubeSearchResult[] = [];
    const batchResults: SuspectAnalysisResult[] = [];

    // Add cached results and identify non-cached items
    batch.forEach((suspect: YouTubeSearchResult, index: number) => {
      const cachedResult = cachedResults[index];
      if (cachedResult) {
        batchResults.push(cachedResult);
        this.logger.log(`✅ Using cached analysis for: ${suspect.videoId}`);
      } else {
        nonCachedBatch.push(suspect);
      }
    });

    // Process non-cached items
    if (nonCachedBatch.length > 0) {
      const batchRequest: BatchAnalysisRequest = {
        original_frames: [...originalFrames],
        suspect_videos: nonCachedBatch.map((suspect: YouTubeSearchResult) => ({
          youtube_id: suspect.videoId,
          title: suspect.title,
          channel: suspect.channelTitle
        })),
        options: {
          confidence_threshold: 0.6,
          enable_temporal_analysis: true,
          max_frames: 100,
          interval_seconds: 3.0
        }
      };

      const batchResult = await this.callAiServiceBatchAnalysis(batchRequest);
      
      if (batchResult.success && batchResult.results) {
        const newResults = batchResult.results.map((result) => ({
          youtube_id: result.youtube_id,
          title: result.title,
          channel: nonCachedBatch.find((s: YouTubeSearchResult) => s.videoId === result.youtube_id)?.channelTitle || 'Unknown',
          visual_similarity: result.visual_similarity,
          temporal_alignment: result.temporal_alignment,
          overall_confidence: result.overall_confidence,
          sequence_matches: result.sequence_matches,
          algorithm_details: result.algorithm_details,
          processing_time_ms: result.processing_time_ms,
          success: result.success,
          error: result.error
        }));

        // Cache individual results for 24 hours
        await Promise.all(
          newResults.map(async (result: SuspectAnalysisResult) => 
            await this.cachingService.set(
              `detective:analysis:${result.youtube_id}`,
              result,
              86400
            )
          )
        );

        batchResults.push(...newResults);
      }
    }

    return batchResults;
  }

  /**
   * ✅ Call AI service with comprehensive error handling
   */
  private async callAiServiceBatchAnalysis(request: BatchAnalysisRequest): Promise<AiBatchAnalysisResponse> {
    try {
      const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://ai-service:5000');
      
      this.logger.log(`🤖 Calling AI service for ${request.suspect_videos.length} suspects`);
      
      const response = await fetch(`${aiServiceUrl}/batch-analyze-suspects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Detective-Agent/1.0'
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(300000), // 5 minutes timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI service responded with status ${response.status}: ${errorText}`);
      }

      const result = await response.json() as AiBatchAnalysisResponse;
      
      if (!result.success) {
        throw new Error(`AI service error: ${JSON.stringify(result)}`);
      }

      this.logger.log(`✅ AI service completed: ${result.results?.length || 0} results`);
      return result;

    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`❌ AI service batch analysis failed: ${errorMessage}`);
      throw new Error(`AI service batch analysis failed: ${errorMessage}`);
    }
  }

  /**
   * ✅ Save detection results with proper error handling
   */
  private async saveDetectionResults(
    videoProcessingId: string, 
    results: ReadonlyArray<SuspectAnalysisResult>
  ): Promise<ReadonlyArray<SuspectVideo>> {
    this.logger.log(`💾 Saving ${results.length} detection results`);

    try {
      const suspectVideos = results
        .filter((result: SuspectAnalysisResult) => result.success && result.overall_confidence >= 0.5)
        .map((result: SuspectAnalysisResult) => 
          this.suspectVideoRepo.create({
            videoProcessing: { id: videoProcessingId },
            youtubeVideoId: result.youtube_id,
            title: result.title || 'Unknown Title',
            channelName: result.channel || 'Unknown Channel',
            similarityScore: result.visual_similarity || 0,
            confidenceScore: result.overall_confidence || 0,
            temporalAlignment: result.temporal_alignment || 0,
            sequenceMatches: result.sequence_matches || [],
            riskLevel: this.calculateRiskLevel(result.overall_confidence || 0),
            detectionDetails: {
              algorithm_details: result.algorithm_details,
              processing_time_ms: result.processing_time_ms,
              detected_at: new Date().toISOString(),
              visual_similarity: result.visual_similarity,
              temporal_alignment: result.temporal_alignment
            },
            isProcessed: true
          } as DeepPartial<SuspectVideo>)
        );

      const savedResults = await this.suspectVideoRepo.save(suspectVideos);
      
      this.logger.log(`✅ Saved ${savedResults.length} suspect video results`);
      return savedResults;

    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`❌ Failed to save results: ${errorMessage}`);
      throw new Error(`Failed to save results: ${errorMessage}`);
    }
  }

  /**
   * ✅ Calculate risk level with proper typing
   */
  private calculateRiskLevel(confidence: number): RiskLevel {
    if (confidence >= 0.85) return 'HIGH';
    if (confidence >= 0.65) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * ✅ Complete detection with comprehensive logging
   */
  private async completeDetection(
    videoProcessingId: string, 
    results: ReadonlyArray<SuspectVideo>
  ): Promise<void> {
    const highRiskCount = results.filter((r: SuspectVideo) => r.riskLevel === 'HIGH').length;
    const mediumRiskCount = results.filter((r: SuspectVideo) => r.riskLevel === 'MEDIUM').length;
    
    await this.videoProcessingRepo.update(videoProcessingId, {
      status: VideoProcessingStatus.COMPLETED, // ✅ Use enum
      progressPercent: 100,
      updatedAt: new Date()
    });
  
    this.logger.log(`✅ Detection completed: ${results.length} suspects found (${highRiskCount} high-risk, ${mediumRiskCount} medium-risk)`);
  }

  /**
   * ✅ Complete detection with no suspects
   */
  private async completeDetectionWithNoSuspects(videoProcessingId: string): Promise<void> {
    await this.videoProcessingRepo.update(videoProcessingId, {
      status: VideoProcessingStatus.COMPLETED, // ✅ Use enum
      progressPercent: 100,
      updatedAt: new Date()
    });
  
    this.logger.log(`ℹ️ Detection completed: No suspect videos found`);
  }  

  /**
   * ✅ Update detection progress with proper typing
   */
  private async updateProgress(videoProcessingId: string, progress: DetectionProgress): Promise<void> {
    // Map phase strings to enum values
    let status: VideoProcessingStatus;
    switch (progress.phase) {
      case 'searching':
        status = VideoProcessingStatus.SEARCHING;
        break;
      case 'extracting':
        status = VideoProcessingStatus.EXTRACTING;
        break;
      case 'analyzing':
        status = VideoProcessingStatus.ANALYZING;
        break;
      case 'compiling':
        status = VideoProcessingStatus.COMPILING;
        break;
      default:
        status = VideoProcessingStatus.DETECTION;
    }
  
    await this.videoProcessingRepo.update(videoProcessingId, {
      status,
      progressPercent: progress.progress,
      updatedAt: new Date()
    });
    
    this.logger.log(`📊 Job ${videoProcessingId}: ${progress.currentTask} (${progress.progress}%)`);
  }

  /**
   * ✅ Update job error with proper error handling
   */
  private async updateJobError(id: string, error: string): Promise<void> {
    await this.videoProcessingRepo.update(id, { 
      status: VideoProcessingStatus.FAILED, // ✅ Use enum
      progressPercent: 0,
      processingError: error.substring(0, 500),
      updatedAt: new Date()
    });
    this.logger.error(`❌ Job ${id} failed: ${error}`);
  }
  

  /**
   * ✅ Utility method for delays
   */
  private async delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  // ✅ PUBLIC API METHODS with strict typing

  /**
   * Get detection status with comprehensive error handling
   */
  public async getDetectionStatus(videoProcessingId: string): Promise<DetectionStatusResponse> {
    const job = await this.videoProcessingRepo.findOne({
      where: { id: videoProcessingId }
    });

    if (!job) {
      throw new Error(`Job ${videoProcessingId} not found`);
    }

    const suspectCount = await this.suspectVideoRepo.count({
      where: { videoProcessing: { id: videoProcessingId } }
    });

    return {
      caseId: job.id,
      status: job.status,
      progressPercent: job.progressPercent,
      videoTitle: job.videoTitle || 'Unknown',
      processingError: job.processingError || null,
      suspectsFound: suspectCount,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };
  }

  /**
   * Get detection results with comprehensive data
   */
  public async getDetectionResults(videoProcessingId: string): Promise<DetectionResultsResponse> {
    const suspects = await this.suspectVideoRepo.find({
      where: { videoProcessing: { id: videoProcessingId } },
      order: { confidenceScore: 'DESC' }
    });

    const job = await this.videoProcessingRepo.findOne({
      where: { id: videoProcessingId },
      relations: ['metadata']
    });

    const highRisk = suspects.filter((s: SuspectVideo) => s.riskLevel === 'HIGH');
    const mediumRisk = suspects.filter((s: SuspectVideo) => s.riskLevel === 'MEDIUM');
    const lowRisk = suspects.filter((s: SuspectVideo) => s.riskLevel === 'LOW');

    return {
      caseId: videoProcessingId,
      originalVideo: {
        title: job?.videoTitle || 'Unknown',
        channel: job?.metadata?.channelName || 'Unknown'
      },
      summary: {
        totalSuspects: suspects.length,
        highRiskMatches: highRisk.length,
        mediumRiskMatches: mediumRisk.length,
        lowRiskMatches: lowRisk.length
      },
      suspects: suspects.map((s: SuspectVideo) => ({
        id: s.id,
        youtubeVideoId: s.youtubeVideoId,
        title: s.title,
        channelName: s.channelName,
        similarityScore: s.similarityScore,
        confidenceScore: s.confidenceScore,
        riskLevel: s.riskLevel,
        temporalAlignment: s.temporalAlignment,
        sequenceMatches: s.sequenceMatches || [],
        youtubeUrl: `https://youtube.com/watch?v=${s.youtubeVideoId}`,
        detectedAt: s.createdAt
      }))
    };
  }

  /**
   * Get enhanced analysis with caching and analytics
   */
  public async getEnhancedResults(videoProcessingId: string): Promise<{
    readonly results: DetectionResultsResponse;
    readonly analytics: EnhancedAnalytics;
  }> {
    const cacheKey = `detective:enhanced:${videoProcessingId}`;
    const cached = await this.cachingService.get<{
      readonly results: DetectionResultsResponse;
      readonly analytics: EnhancedAnalytics;
    }>(cacheKey);
    
    if (cached) {
      this.logger.log(`✅ Using cached enhanced results for ${videoProcessingId}`);
      return cached;
    }

    const results = await this.getDetectionResults(videoProcessingId);
    
    const analytics: EnhancedAnalytics = {
      averageConfidence: results.suspects.length > 0 
        ? results.suspects.reduce((sum: number, s) => sum + s.confidenceScore, 0) / results.suspects.length 
        : 0,
      topChannels: this.getTopChannels(results.suspects),
      riskDistribution: {
        HIGH: results.summary.highRiskMatches,
        MEDIUM: results.summary.mediumRiskMatches,
        LOW: results.summary.lowRiskMatches
      },
      detectionEfficiency: this.calculateDetectionEfficiency(results.suspects)
    };

    const enhanced = { results, analytics };
    
    // Cache for 30 minutes
    await this.cachingService.set(cacheKey, enhanced, 1800);
    
    return enhanced;
  }

  /**
   * ✅ Get top channels with proper typing
   */
  private getTopChannels(suspects: ReadonlyArray<{ readonly channelName: string }>): ReadonlyArray<{ readonly channel: string; readonly count: number }> {
    const channelCounts = suspects.reduce((acc: Record<string, number>, suspect) => {
      acc[suspect.channelName] = (acc[suspect.channelName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(channelCounts)
      .map(([channel, count]: [string, number]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * ✅ Calculate detection efficiency
   */
  private calculateDetectionEfficiency(suspects: ReadonlyArray<{ readonly confidenceScore: number }>): number {
    if (suspects.length === 0) return 0;
    
    const highConfidenceCount = suspects.filter((s) => s.confidenceScore >= 0.8).length;
    return (highConfidenceCount / suspects.length) * 100;
  }

  /**
   * ✅ Enhanced error message helper with comprehensive type checking
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error occurred';
  }
}
