// src/agents/detective/interfaces/detective-agent.interfaces.ts

export interface AiFrameExtractionResponse {
    frames: Array<{
      timestamp: number;
      phash: string;
      dct_hash: string;
      tf_embedding: number[] | null;
      advanced_features: Record<string, unknown>;
      width: number;
      height: number;
      frame_path?: string;
    }>;
    total_frames: number;
    success: boolean;
    error?: string;
  }
  
  export interface AiSimilarityAnalysisResponse {
    visual_similarity: number;
    temporal_alignment: number;
    overall_confidence: number;
    sequence_matches: Array<{
      original_timestamp: number;
      suspect_timestamp: number;
      confidence: number;
      frame_matches: number;
      duration: number;
    }>;
    algorithm_details: Record<string, unknown>;
    processing_time_ms: number;
    success: boolean;
    error?: string;
  }
  
  export interface AiBatchAnalysisResponse {
    results: Array<{
      youtube_id: string;
      title: string;
      visual_similarity: number;
      temporal_alignment: number;
      overall_confidence: number;
      sequence_matches: Array<{
        original_timestamp: number;
        suspect_timestamp: number;
        confidence: number;
        frame_matches: number;
        duration: number;
      }>;
      algorithm_details: Record<string, unknown>;
      processing_time_ms: number;
      success: boolean;
      error?: string;
    }>;
    batch_summary: {
      total_processed: number;
      successful: number;
      failed: number;
    };
    success: boolean;
  }
  
  export interface YouTubeSearchResult {
    videoId: string;
    title: string;
    channelTitle: string;
    publishedAt: string;
    duration: string;
    viewCount: number;
    thumbnailUrl: string;
    description?: string;
  }
  
  export interface DetectionProgress {
    phase: 'searching' | 'extracting' | 'analyzing' | 'compiling';
    progress: number;
    currentTask: string;
    suspectCount?: number;
    processedCount?: number;
  }
  
  export interface PreparedFrame {
    timestamp: number;
    features: {
      phash: string;
      dct_hash: string;
      tf_embedding: number[] | null;
      advanced_features: Record<string, unknown>;
    };
    width: number;
    height: number;
  }
  
  export interface BatchAnalysisRequest {
    original_frames: PreparedFrame[];
    suspect_videos: Array<{
      youtube_id: string;
      title: string;
      channel: string;
    }>;
    options: {
      confidence_threshold: number;
      enable_temporal_analysis: boolean;
      max_frames: number;
      interval_seconds: number;
    };
  }
  
  export interface DetectionStatusResponse {
    caseId: string;
    status: string;
    progressPercent: number;
    videoTitle: string;
    processingError: string | null;
    suspectsFound: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface DetectionResultsResponse {
    caseId: string;
    originalVideo: {
      title: string;
      channel: string;
    };
    summary: {
      totalSuspects: number;
      highRiskMatches: number;
      mediumRiskMatches: number;
      lowRiskMatches: number;
    };
    suspects: Array<{
      id: string;
      youtubeVideoId: string;
      title: string;
      channelName: string;
      similarityScore: number;
      confidenceScore: number;
      riskLevel: string;
      temporalAlignment: number;
      sequenceMatches: Array<{
        original_timestamp: number;
        suspect_timestamp: number;
        confidence: number;
        frame_matches: number;
        duration: number;
      }>;
      youtubeUrl: string;
      detectedAt: Date;
    }>;
  }
  
  export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
  
  export interface SuspectAnalysisResult {
    youtube_id: string;
    title: string;
    channel: string;
    visual_similarity: number;
    temporal_alignment: number;
    overall_confidence: number;
    sequence_matches: Array<{
      original_timestamp: number;
      suspect_timestamp: number;
      confidence: number;
      frame_matches: number;
      duration: number;
    }>;
    algorithm_details: Record<string, unknown>;
    processing_time_ms: number;
    success: boolean;
    error?: string;
  }
  