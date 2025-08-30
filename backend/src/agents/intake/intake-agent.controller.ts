import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IntakeAgentService } from './intake-agent.service';

@Controller('intake-agent')
export class IntakeAgentController {
    constructor(private readonly intakeAgentService: IntakeAgentService) {}
    
    @Post('submit')
    async submitVideo(@Body() body: { userId: string; youtubeUrl: string }) {
        const result = await this.intakeAgentService.validateAndQueue(
            body.userId,
            body.youtubeUrl
        );

        return {
            success: true,
            caseId: result.id,
            status: result.status,
            progressPercent: result.progressPercent,
            etaMinutes: result.etaMinutes,
            message: 'Video queued for copyright detection successfully!'
        };
    }

    @Get('jobs')
    async getAllJobs() {
        const jobs = await this.intakeAgentService.getAllProcessingJobs();
        return {
            success: true,
            count: jobs.length,
            jobs: jobs
        }
    }

    @Get('jobs/:id')
    async getJob(@Param('id') id: string) {
        const job = await this.intakeAgentService.getJobById(id);
        return {
            success: true,
            job: job
        };
    }
}