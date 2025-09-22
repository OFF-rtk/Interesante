export interface AIAnalysisResponse {
    status: string;
    analysis?: {
      analysis_id: string;
      timestamp: string;
      files: {
        original: {
          filename: string;
          size: number;
          sha256: string;
        };
        suspected: {
          filename: string;
          size: number;
          sha256: string;
        };
      };
      similarity_analysis: {
        visual_similarity: number;
        temporal_alignment: number;
        overall_confidence: number;
        matched_frames: MatchedFrame[];
        frame_count_original: number;
        frame_count_suspected: number;
        analysis_metadata: AnalysisMetadata;
      };
      technical_metadata: {
        processing_engine: string;
        analysis_timestamp: string;
        algorithms_used: string[];
      };
    };
    error?: string;
  }
  
  export interface MatchedFrame {
    original_frame: number;
    suspected_frame: number;
    similarity: number;
    original_timestamp: number;
    suspected_timestamp: number;
  }
  
  export interface AnalysisMetadata {
    algorithm_version: string;
    max_frames_analyzed: number;
    total_matches_found: number;
    match_threshold: number;
    processing_time: number;
  }
  
  export interface AnalysisReportData {
    analysisId: string;
    timestamp: string;
    files: {
      original: FileInfo;
      suspected: FileInfo;
    };
    similarity_analysis: {
      visual_similarity: number;
      temporal_alignment: number;
      overall_confidence: number;
      matched_frames: MatchedFrame[];
      frame_count_original: number;
      frame_count_suspected: number;
    };
    technical_metadata: {
      processing_engine: string;
      analysis_timestamp: string;
      algorithms_used: string[];
    };
    reportHash: string;
    verificationUrl: string;
  }
  
  interface FileInfo {
    filename: string;
    size: number;
    sha256: string;
  }
  