// src/agents/detective/detective-agent.controller.ts

import { 
    Controller, 
    Post, 
    Get, 
    Param, 
    Res, 
    HttpStatus,
    NotFoundException, 
    InternalServerErrorException,
    BadRequestException,
    Logger
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiParam, 
    ApiOkResponse,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiInternalServerErrorResponse
  } from '@nestjs/swagger';
  import type { Response } from 'express';
  import { DetectiveAgentService } from './detective-agent.service';
  import { EvidenceCompilerService } from './services/evidence-compiler.service';
  import { YouTubeSearchService } from './services/youtube-search.service';
  import type { 
    DetectionStatusResponse, 
    DetectionResultsResponse
  } from './interfaces/detective-agent.interfaces';
  
  // ✅ Proper DTOs for type safety
  export class DetectionStartResponseDto {
    readonly message: string;
    readonly caseId: string;
    readonly timestamp: string;
  }
  
  export class QuotaUsageDto {
    readonly used: number;
    readonly limit: number;
    readonly remaining: number;
    readonly percentUsed: number;
  }
  
  export class HealthCheckDto {
    readonly status: string;
    readonly service: string;
    readonly timestamp: string;
    readonly uptime: number;
    readonly version: string;
  }
  
  @ApiTags('🕵️ Detective Agent')
  @Controller('detective')
  export class DetectiveAgentController {
    private readonly logger = new Logger(DetectiveAgentController.name);
  
    constructor(
      private readonly detectiveAgentService: DetectiveAgentService,
      private readonly evidenceCompilerService: EvidenceCompilerService,
      private readonly youTubeSearchService: YouTubeSearchService,
    ) {}
  
    /**
     * ✅ FIXED: Removed async since no await is needed
     */
    @Post(':id/start')
    @ApiOperation({ 
      summary: 'Start copyright detection analysis',
      description: 'Initiates the copyright detection workflow for a processed video job'
    })
    @ApiParam({ name: 'id', description: 'Video processing job ID' })
    @ApiOkResponse({ description: 'Detection started successfully', type: DetectionStartResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid job ID' })
    @ApiNotFoundResponse({ description: 'Job not found' })
    public startDetection(@Param('id') jobId: string): DetectionStartResponseDto {
      this.logger.log(`🚀 Starting detection for job: ${jobId}`);
  
      if (!jobId || jobId.trim().length === 0) {
        throw new BadRequestException('Job ID is required');
      }
  
      try {
        // This method is void and doesn't return a promise, so no await needed
        this.detectiveAgentService.startDetection(jobId);
  
        return {
          message: 'Detection analysis started successfully',
          caseId: jobId,
          timestamp: new Date().toISOString()
        };
  
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(`❌ Failed to start detection for job ${jobId}: ${errorMessage}`);
        throw new InternalServerErrorException(`Failed to start detection: ${errorMessage}`);
      }
    }
  
    /**
     * ✅ Get detection status
     */
    @Get(':id/status')
    @ApiOperation({ 
      summary: 'Get detection analysis status',
      description: 'Retrieves the current status and progress of a detection job'
    })
    @ApiParam({ name: 'id', description: 'Video processing job ID' })
    @ApiOkResponse({ description: 'Detection status retrieved successfully' })
    @ApiNotFoundResponse({ description: 'Detection job not found' })
    public async getDetectionStatus(@Param('id') jobId: string): Promise<DetectionStatusResponse> {
      this.logger.log(`📊 Getting status for job: ${jobId}`);
  
      try {
        return await this.detectiveAgentService.getDetectionStatus(jobId);
      } catch (error: unknown) {
        this.logger.error(`❌ Failed to get status for job ${jobId}: ${this.getErrorMessage(error)}`);
        throw new NotFoundException(`Detection job ${jobId} not found`);
      }
    }
  
    /**
     * ✅ Get detection results
     */
    @Get(':id/results')
    @ApiOperation({ 
      summary: 'Get detection analysis results',
      description: 'Retrieves the complete analysis results including suspect videos and risk assessments'
    })
    @ApiParam({ name: 'id', description: 'Video processing job ID' })
    @ApiOkResponse({ description: 'Detection results retrieved successfully' })
    @ApiNotFoundResponse({ description: 'Detection results not found' })
    public async getDetectionResults(@Param('id') jobId: string): Promise<DetectionResultsResponse> {
      this.logger.log(`🎯 Getting results for job: ${jobId}`);
  
      try {
        return await this.detectiveAgentService.getDetectionResults(jobId);
      } catch (error: unknown) {
        this.logger.error(`❌ Failed to get results for job ${jobId}: ${this.getErrorMessage(error)}`);
        throw new NotFoundException(`Detection results for job ${jobId} not found`);
      }
    }
  
    /**
     * ✅ Get enhanced analytics
     */
    @Get(':id/analytics')
    @ApiOperation({ 
      summary: 'Get enhanced detection analytics',
      description: 'Retrieves detailed analytics including confidence metrics and channel analysis'
    })
    @ApiParam({ name: 'id', description: 'Video processing job ID' })
    @ApiOkResponse({ description: 'Enhanced analytics retrieved successfully' })
    @ApiNotFoundResponse({ description: 'Analytics not found' })
    public async getEnhancedAnalytics(@Param('id') jobId: string): Promise<{
      readonly results: DetectionResultsResponse;
      readonly analytics: {
        readonly averageConfidence: number;
        readonly topChannels: ReadonlyArray<{ readonly channel: string; readonly count: number }>;
        readonly riskDistribution: Record<string, number>;
        readonly detectionEfficiency: number;
      };
    }> {
      this.logger.log(`📈 Getting enhanced analytics for job: ${jobId}`);
  
      try {
        return await this.detectiveAgentService.getEnhancedResults(jobId);
      } catch (error: unknown) {
        this.logger.error(`❌ Failed to get analytics for job ${jobId}: ${this.getErrorMessage(error)}`);
        throw new NotFoundException(`Analytics for job ${jobId} not found`);
      }
    }
  
    /**
     * ✅ Download evidence report as PDF
     */
    @Get(':id/download/pdf')
    @ApiOperation({ 
      summary: 'Download detection report as PDF',
      description: 'Generates and downloads a comprehensive PDF evidence report for legal proceedings'
    })
    @ApiParam({ name: 'id', description: 'Video processing job ID' })
    @ApiOkResponse({ description: 'PDF report generated and downloaded successfully' })
    @ApiNotFoundResponse({ description: 'Job not found or no results available' })
    @ApiInternalServerErrorResponse({ description: 'Failed to generate PDF report' })
    public async downloadPdfReport(
      @Param('id') jobId: string, 
      @Res() response: Response
    ): Promise<void> {
      this.logger.log(`📄 Generating PDF report for job: ${jobId}`);
  
      try {
        const evidenceReport = await this.evidenceCompilerService.generateEvidenceReport(jobId);
        const pdfBuffer = await this.evidenceCompilerService.exportToPdf(evidenceReport);
  
        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `attachment; filename="evidence-report-${jobId}.pdf"`);
        response.setHeader('Content-Length', pdfBuffer.length);
        response.end(pdfBuffer);
  
        this.logger.log(`✅ PDF report generated successfully for job: ${jobId} (${pdfBuffer.length} bytes)`);
  
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(`❌ Failed to generate PDF for job ${jobId}: ${errorMessage}`);
        
        if (!response.headersSent) {
          response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to generate PDF report',
            error: errorMessage,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  
    /**
     * ✅ Download evidence report as Word document
     */
    @Get(':id/download/word')
    @ApiOperation({ 
      summary: 'Download detection report as Word document',
      description: 'Generates and downloads a comprehensive Word evidence report for legal proceedings'
    })
    @ApiParam({ name: 'id', description: 'Video processing job ID' })
    @ApiOkResponse({ description: 'Word document generated and downloaded successfully' })
    @ApiNotFoundResponse({ description: 'Job not found or no results available' })
    @ApiInternalServerErrorResponse({ description: 'Failed to generate Word document' })
    public async downloadWordReport(
      @Param('id') jobId: string, 
      @Res() response: Response
    ): Promise<void> {
      this.logger.log(`📝 Generating Word report for job: ${jobId}`);
  
      try {
        const evidenceReport = await this.evidenceCompilerService.generateEvidenceReport(jobId);
        const wordBuffer = await this.evidenceCompilerService.exportToWord(evidenceReport);
  
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        response.setHeader('Content-Disposition', `attachment; filename="evidence-report-${jobId}.docx"`);
        response.setHeader('Content-Length', wordBuffer.length);
        response.end(wordBuffer);
  
        this.logger.log(`✅ Word report generated successfully for job: ${jobId} (${wordBuffer.length} bytes)`);
  
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(`❌ Failed to generate Word document for job ${jobId}: ${errorMessage}`);
        
        if (!response.headersSent) {
          response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to generate Word document',
            error: errorMessage,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  
    /**
     * ✅ Generate DMCA takedown notice
     */
    @Post(':id/dmca/:suspectId')
    @ApiOperation({ 
      summary: 'Generate DMCA takedown notice',
      description: 'Creates a DMCA takedown notice for a specific suspect video'
    })
    @ApiParam({ name: 'id', description: 'Video processing job ID' })
    @ApiParam({ name: 'suspectId', description: 'Suspect video ID' })
    @ApiOkResponse({ description: 'DMCA notice generated successfully' })
    @ApiNotFoundResponse({ description: 'Job or suspect not found' })
    @ApiInternalServerErrorResponse({ description: 'Failed to generate DMCA notice' })
    public async generateDmcaNotice(
      @Param('id') jobId: string,
      @Param('suspectId') suspectId: string
    ): Promise<{
      readonly noticeId: string;
      readonly platform: string;
      readonly caseId: string;
      readonly suspectVideoId: string;
      readonly status: string;
      readonly createdAt: Date;
    }> {
      this.logger.log(`📋 Generating DMCA notice for job ${jobId}, suspect ${suspectId}`);
  
      try {
        const claimantInfo = {
          name: 'Copyright Holder',
          email: 'copyright@example.com',
          address: '123 Copyright St, Legal City, LC 12345'
        };
  
        return await this.evidenceCompilerService.generateDmcaNotice(jobId, suspectId, claimantInfo);
  
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(`❌ Failed to generate DMCA notice: ${errorMessage}`);
        throw new InternalServerErrorException(`Failed to generate DMCA notice: ${errorMessage}`);
      }
    }
  
    /**
     * ✅ FIXED: Removed async since getQuotaUsage is synchronous
     */
    @Get('youtube/quota')
    @ApiOperation({ 
      summary: 'Get YouTube API quota usage',
      description: 'Returns current YouTube API quota usage and limits'
    })
    @ApiOkResponse({ description: 'Quota information retrieved successfully', type: QuotaUsageDto })
    @ApiInternalServerErrorResponse({ description: 'Failed to get quota usage' })
    public getYouTubeQuotaUsage(): QuotaUsageDto {
      this.logger.log(`🔍 Getting YouTube API quota usage`);
  
      try {
        const quota = this.youTubeSearchService.getQuotaUsage();
        
        return {
          ...quota,
          percentUsed: Math.round((quota.used / quota.limit) * 100)
        };
  
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(`❌ Failed to get quota usage: ${errorMessage}`);
        throw new InternalServerErrorException(`Failed to get quota usage: ${errorMessage}`);
      }
    }
  
    /**
     * ✅ FIXED: Removed async since resetQuota is synchronous
     */
    @Post('youtube/quota/reset')
    @ApiOperation({ 
      summary: 'Reset YouTube API quota counter',
      description: 'Resets the daily YouTube API quota counter (admin only)'
    })
    @ApiOkResponse({ description: 'Quota reset successfully' })
    @ApiInternalServerErrorResponse({ description: 'Failed to reset quota' })
    public resetYouTubeQuota(): {
      readonly message: string;
      readonly timestamp: string;
    } {
      this.logger.log(`🔄 Resetting YouTube API quota`);
  
      try {
        this.youTubeSearchService.resetQuota();
        
        return {
          message: 'YouTube API quota reset successfully',
          timestamp: new Date().toISOString()
        };
  
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(`❌ Failed to reset quota: ${errorMessage}`);
        throw new InternalServerErrorException(`Failed to reset quota: ${errorMessage}`);
      }
    }
  
    /**
     * ✅ Test YouTube search functionality
     */
    @Get('test/youtube/:query')
    @ApiOperation({ 
      summary: 'Test YouTube search functionality',
      description: 'Tests the YouTube search API with a given query (development only)'
    })
    @ApiParam({ name: 'query', description: 'Search query to test' })
    @ApiOkResponse({ description: 'YouTube search test completed successfully' })
    @ApiInternalServerErrorResponse({ description: 'YouTube search test failed' })
    public async testYouTubeSearch(@Param('query') query: string): Promise<{
      readonly query: string;
      readonly resultsCount: number;
      readonly quotaUsed: number;
      readonly fromCache: boolean;
      readonly results: ReadonlyArray<{
        readonly videoId: string;
        readonly title: string;
        readonly channelTitle: string;
        readonly publishedAt: string;
        readonly viewCount: number;
      }>;
    }> {
      this.logger.log(`🧪 Testing YouTube search: "${query}"`);
  
      try {
        const results = await this.youTubeSearchService.searchVideos(query, {
          maxResults: 5,
          order: 'relevance'
        });
  
        return {
          query,
          resultsCount: results.videos.length,
          quotaUsed: results.quotaUsed,
          fromCache: results.fromCache,
          results: results.videos.map(video => ({
            videoId: video.videoId,
            title: video.title,
            channelTitle: video.channelTitle,
            publishedAt: video.publishedAt,
            viewCount: video.viewCount
          }))
        };
  
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(`❌ YouTube search test failed: ${errorMessage}`);
        throw new InternalServerErrorException(`YouTube search test failed: ${errorMessage}`);
      }
    }
  
    /**
     * ✅ FIXED: Removed async since no await is needed
     */
    @Get('health')
    @ApiOperation({ 
      summary: 'Health check',
      description: 'Checks the health of the Detective Agent service'
    })
    @ApiOkResponse({ description: 'Service is healthy', type: HealthCheckDto })
    public healthCheck(): HealthCheckDto {
      return {
        status: 'healthy',
        service: 'Detective Agent',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      };
    }
  
    /**
     * ✅ Private helper method for error message extraction
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
  