// src/agents/detective/services/youtube-search.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CachingService } from './caching.service';

export interface YouTubeSearchOptions {
  maxResults?: number;
  publishedAfter?: string;
  publishedBefore?: string;
  duration?: 'short' | 'medium' | 'long';
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
  safeSearch?: 'moderate' | 'none' | 'strict';
  [key: string]: unknown;
}

export interface YouTubeVideoResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
}

export interface YouTubeSearchResponse {
  videos: YouTubeVideoResult[];
  totalResults: number;
  nextPageToken?: string;
  quotaUsed: number;
  fromCache: boolean;
}

export interface YouTubeChannelResult {
  channelId: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  thumbnailUrl: string;
}

export interface YouTubeApiError {
  code: number;
  message: string;
  quotaExceeded: boolean;
}

@Injectable()
export class YouTubeSearchService {
  private readonly logger = new Logger('🔍 YouTubeSearch');
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly apiKey: string;
  private quotaUsed = 0;
  private readonly dailyQuotaLimit = 10000; // YouTube API daily quota

  constructor(
    private readonly configService: ConfigService,
    private readonly cachingService: CachingService,
  ) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY', '');
    if (!this.apiKey) {
      this.logger.error('❌ YouTube API key not configured - service will not function');
      throw new Error('YouTube API key is required but not configured');
    }
  }

  /**
   * 🚀 REAL IMPLEMENTATION: Search for videos with caching and quota management
   */
  public async searchVideos(
    query: string,
    options: YouTubeSearchOptions = {}
  ): Promise<YouTubeSearchResponse> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey('search', query, options);
      const cached = await this.cachingService.get<YouTubeSearchResponse>(cacheKey);
      
      if (cached) {
        this.logger.log(`✅ Cache hit for query: "${query}"`);
        return { ...cached, fromCache: true };
      }

      // Check quota before making API call
      const quotaCost = this.calculateQuotaCost('search', options);
      if (this.quotaUsed + quotaCost > this.dailyQuotaLimit) {
        const errorMsg = `YouTube API quota exceeded: ${this.quotaUsed}/${this.dailyQuotaLimit}`;
        this.logger.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Make real API call
      const response = await this.makeSearchRequest(query, options);
      
      // Cache successful response
      await this.cachingService.set(cacheKey, response, 3600); // 1 hour cache
      
      this.quotaUsed += quotaCost;
      this.logger.log(`📊 Quota used: ${this.quotaUsed}/${this.dailyQuotaLimit}`);
      
      return { ...response, fromCache: false };

    } catch (error) {
      this.logger.error(`❌ YouTube search failed: ${this.getErrorMessage(error)}`);
      
      if (this.isQuotaError(error)) {
        throw new Error(`YouTube API quota exceeded: ${this.getErrorMessage(error)}`);
      }
      
      throw error instanceof Error ? error : new Error(`YouTube search failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * 🚀 REAL IMPLEMENTATION: Get detailed video information
   */
  public async getVideoDetails(videoIds: string[]): Promise<YouTubeVideoResult[]> {
    if (!videoIds.length) {
      return [];
    }

    try {
      const cacheKey = this.generateCacheKey('details', videoIds.join(','));
      const cached = await this.cachingService.get<YouTubeVideoResult[]>(cacheKey);
      
      if (cached) {
        this.logger.log(`✅ Cache hit for video details: ${videoIds.length} videos`);
        return cached;
      }

      const quotaCost = this.calculateQuotaCost('details', { videoCount: videoIds.length });
      if (this.quotaUsed + quotaCost > this.dailyQuotaLimit) {
        throw new Error(`YouTube API quota would be exceeded: ${this.quotaUsed + quotaCost}/${this.dailyQuotaLimit}`);
      }

      const details = await this.makeVideoDetailsRequest(videoIds);
      
      // Cache for 24 hours (video details change less frequently)
      await this.cachingService.set(cacheKey, details, 86400);
      
      this.quotaUsed += quotaCost;
      this.logger.log(`📊 Retrieved details for ${details.length} videos`);
      
      return details;

    } catch (error) {
      this.logger.error(`❌ Video details fetch failed: ${this.getErrorMessage(error)}`);
      throw error instanceof Error ? error : new Error(`Failed to get video details: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * 🚀 REAL IMPLEMENTATION: Search for channels
   */
  public async searchChannels(query: string): Promise<YouTubeChannelResult[]> {
    try {
      const cacheKey = this.generateCacheKey('channels', query);
      const cached = await this.cachingService.get<YouTubeChannelResult[]>(cacheKey);
      
      if (cached) {
        this.logger.log(`✅ Cache hit for channel search: "${query}"`);
        return cached;
      }

      // Implementation for real channel search
      const channels = await this.makeChannelSearchRequest(query);
      await this.cachingService.set(cacheKey, channels, 7200); // 2 hours cache
      
      this.logger.log(`📊 Found ${channels.length} channels for query: "${query}"`);
      return channels;

    } catch (error) {
      this.logger.error(`❌ Channel search failed: ${this.getErrorMessage(error)}`);
      throw error instanceof Error ? error : new Error(`Channel search failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get current quota usage
   */
  public getQuotaUsage(): { used: number; limit: number; remaining: number } {
    return {
      used: this.quotaUsed,
      limit: this.dailyQuotaLimit,
      remaining: this.dailyQuotaLimit - this.quotaUsed
    };
  }

  /**
   * Reset daily quota (call this daily via cron job)
   */
  public resetQuota(): void {
    this.quotaUsed = 0;
    this.logger.log('🔄 Daily quota reset');
  }

  // 🚀 REAL IMPLEMENTATION: Private methods

  private async makeSearchRequest(query: string, options: YouTubeSearchOptions): Promise<YouTubeSearchResponse> {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      key: this.apiKey,
      maxResults: (options.maxResults || 25).toString(),
      order: options.order || 'relevance',
      safeSearch: options.safeSearch || 'moderate'
    });

    if (options.publishedAfter) params.append('publishedAfter', options.publishedAfter);
    if (options.publishedBefore) params.append('publishedBefore', options.publishedBefore);
    if (options.duration) params.append('videoDuration', options.duration);

    const url = `${this.baseUrl}/search?${params}`;
    
    this.logger.log(`🔍 Making YouTube search API call: "${query}"`);
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Detective-Agent-Copyright-Shield/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `YouTube API search error: ${response.status} ${response.statusText} - ${errorText}`;
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await response.json() as {
      items: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          description: string;
          channelTitle: string;
          channelId: string;
          publishedAt: string;
          thumbnails: {
            default: { url: string };
            medium?: { url: string };
            high?: { url: string };
          };
        };
      }>;
      pageInfo: { totalResults: number };
      nextPageToken?: string;
    };

    if (!data.items || data.items.length === 0) {
      this.logger.warn(`⚠️ No results found for query: "${query}"`);
      return {
        videos: [],
        totalResults: 0,
        quotaUsed: this.calculateQuotaCost('search', options),
        fromCache: false
      };
    }

    // Get detailed stats for all videos in parallel
    const videoIds = data.items.map(item => item.id.videoId);
    const videoStats = await this.getVideoStats(videoIds);

    const videos: YouTubeVideoResult[] = data.items.map(item => {
      const stats = videoStats.find(s => s.videoId === item.id.videoId);
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
        duration: stats?.duration || 'PT0S',
        viewCount: stats?.viewCount || 0,
        likeCount: stats?.likeCount || 0,
        commentCount: stats?.commentCount || 0,
        tags: stats?.tags || []
      };
    });

    return {
      videos,
      totalResults: data.pageInfo.totalResults,
      nextPageToken: data.nextPageToken,
      quotaUsed: this.calculateQuotaCost('search', options),
      fromCache: false
    };
  }

  private async getVideoStats(videoIds: string[]): Promise<Array<{
    videoId: string;
    duration: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    tags: string[];
  }>> {
    if (videoIds.length === 0) return [];

    try {
      const params = new URLSearchParams({
        part: 'statistics,contentDetails,snippet',
        id: videoIds.join(','),
        key: this.apiKey
      });

      const url = `${this.baseUrl}/videos?${params}`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Detective-Agent-Copyright-Shield/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`⚠️ Failed to get video stats: ${response.status} - ${errorText}`);
        return [];
      }

      const data = await response.json() as {
        items: Array<{
          id: string;
          statistics: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
          };
          contentDetails: {
            duration: string;
          };
          snippet: {
            tags?: string[];
          };
        }>;
      };

      return data.items.map(item => ({
        videoId: item.id,
        duration: item.contentDetails.duration,
        viewCount: parseInt(item.statistics.viewCount || '0', 10),
        likeCount: parseInt(item.statistics.likeCount || '0', 10),
        commentCount: parseInt(item.statistics.commentCount || '0', 10),
        tags: item.snippet.tags || []
      }));

    } catch (error) {
      this.logger.warn(`⚠️ Failed to get video stats: ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  private async makeVideoDetailsRequest(videoIds: string[]): Promise<YouTubeVideoResult[]> {
    if (videoIds.length === 0) return [];

    const params = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: videoIds.join(','),
      key: this.apiKey
    });

    const url = `${this.baseUrl}/videos?${params}`;
    
    this.logger.log(`📊 Fetching details for ${videoIds.length} videos`);
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Detective-Agent-Copyright-Shield/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `YouTube API video details error: ${response.status} ${response.statusText} - ${errorText}`;
      throw new Error(errorMsg);
    }

    const data = await response.json() as {
      items: Array<{
        id: string;
        snippet: {
          title: string;
          description: string;
          channelTitle: string;
          channelId: string;
          publishedAt: string;
          thumbnails: {
            default: { url: string };
            medium?: { url: string };
          };
          tags?: string[];
        };
        statistics: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
        contentDetails: {
          duration: string;
        };
      }>;
    };

    return data.items.map(item => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      duration: item.contentDetails.duration,
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      likeCount: parseInt(item.statistics.likeCount || '0', 10),
      commentCount: parseInt(item.statistics.commentCount || '0', 10),
      tags: item.snippet.tags || []
    }));
  }

  private async makeChannelSearchRequest(query: string): Promise<YouTubeChannelResult[]> {
    // First, search for channels
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'channel',
      key: this.apiKey,
      maxResults: '10'
    });

    const searchUrl = `${this.baseUrl}/search?${searchParams}`;
    
    this.logger.log(`🔍 Searching for channels: "${query}"`);
    
    const searchResponse = await fetch(searchUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Detective-Agent-Copyright-Shield/1.0'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      const errorMsg = `YouTube API channel search error: ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`;
      throw new Error(errorMsg);
    }

    const searchData = await searchResponse.json() as {
      items: Array<{
        id: { channelId: string };
        snippet: {
          title: string;
          description: string;
          thumbnails: {
            default: { url: string };
          };
        };
      }>;
    };

    if (!searchData.items || searchData.items.length === 0) {
      this.logger.warn(`⚠️ No channels found for query: "${query}"`);
      return [];
    }

    // Get detailed channel statistics
    const channelIds = searchData.items.map(item => item.id.channelId);
    const channelStats = await this.getChannelStats(channelIds);

    return searchData.items.map(item => {
      const stats = channelStats.find(s => s.channelId === item.id.channelId);
      return {
        channelId: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        subscriberCount: stats?.subscriberCount || 0,
        videoCount: stats?.videoCount || 0,
        thumbnailUrl: item.snippet.thumbnails.default.url
      };
    });
  }

  private async getChannelStats(channelIds: string[]): Promise<Array<{
    channelId: string;
    subscriberCount: number;
    videoCount: number;
  }>> {
    if (channelIds.length === 0) return [];

    try {
      const params = new URLSearchParams({
        part: 'statistics',
        id: channelIds.join(','),
        key: this.apiKey
      });

      const url = `${this.baseUrl}/channels?${params}`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Detective-Agent-Copyright-Shield/1.0'
        }
      });

      if (!response.ok) {
        this.logger.warn(`⚠️ Failed to get channel stats: ${response.status}`);
        return [];
      }

      const data = await response.json() as {
        items: Array<{
          id: string;
          statistics: {
            subscriberCount?: string;
            videoCount?: string;
          };
        }>;
      };

      return data.items.map(item => ({
        channelId: item.id,
        subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
        videoCount: parseInt(item.statistics.videoCount || '0', 10)
      }));

    } catch (error) {
      this.logger.warn(`⚠️ Failed to get channel stats: ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  private generateCacheKey(type: string, query: string, options?: Record<string, unknown>): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `youtube:${type}:${Buffer.from(query + optionsStr).toString('base64')}`;
  }

  private calculateQuotaCost(operation: string, options?: Record<string, unknown>): number {
    const costs = {
      search: 100,      // Search API call
      details: 1,       // Video details (per video)  
      channels: 100     // Channel search
    };

    let baseCost = costs[operation as keyof typeof costs] || 1;
    
    if (operation === 'details' && options?.videoCount) {
      baseCost = (options.videoCount as number) * 1;
    }

    return baseCost;
  }

  private isQuotaError(error: unknown): boolean {
    const errorMessage = this.getErrorMessage(error);
    return errorMessage.includes('quota') || 
           errorMessage.includes('limit') || 
           errorMessage.includes('403') ||
           errorMessage.includes('quotaExceeded');
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error occurred';
  }
}
