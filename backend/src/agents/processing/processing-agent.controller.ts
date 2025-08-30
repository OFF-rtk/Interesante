import { Controller, Post, Get, Param, Body, BadRequestException } from '@nestjs/common';
import { ProcessingAgentService } from './processing-agent.service';

@Controller('processing-agent')
export class ProcessingAgentController {
    constructor(
        private readonly processingAgentService: ProcessingAgentService
    ) { }
    
    @Post('start/:jobId')
    async startProcessing(@Param('jobId') jobId: string) {
        try {
            await this.processingAgentService.startProcessing(jobId);

            return {
                success: true,
                message: 'Video processing started',
                jobId: jobId,
                status: 'processing'
            };
        } catch (error) {
            throw new BadRequestException(`Failed to start processing: ${error.message}`);
        }
    }

    @Get('status/:jobId')
    async getProcessingStatus(@Param('jobId') jobId: string) {
        return {
            success: true,
            jobId: jobId,
            message: 'Status endpoint ready - full implementation coming next'
        };
    }

    @Get('metadata/:jobId')
    async getMetadata(@Param('jobId') jobId: string) {
        return {
            success: true,
            jobId: jobId,
            message: 'Metadata endpoint ready - full implementation coming next'
        };
    }
}
