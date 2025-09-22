import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../decorators/user.decorator';
import { FraudDetectionService, type CreateFraudReportDto } from './fraud-detection.service';

@Controller('fraud')
export class FraudDetectionController {
  constructor(private fraudDetectionService: FraudDetectionService) {}

  @Post('report')
  async reportFraud(
    @Body() reportData: CreateFraudReportDto,
    @Request() req: any
  ) {
    // Extract IP address from request
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    const report = await this.fraudDetectionService.reportFraud({
      ...reportData,
      reporterIpAddress: ipAddress,
    });

    return {
      success: true,
      message: 'Fraud report submitted successfully',
      reportId: report.id,
      status: report.status,
    };
  }

  @Post('revoke/:certificateId')
  @UseGuards(AuthGuard('jwt'))
  async revokeCertificate(
    @Param('certificateId') certificateId: string,
    @Body('reason') reason: string,
    @User() userId: string
  ) {
    // Only admins can revoke certificates (add role check later)
    return this.fraudDetectionService.revokeCertificate(certificateId, reason, userId);
  }

  @Get('reports')
  @UseGuards(AuthGuard('jwt'))
  async getFraudReports(@User() userId: string) {
    return this.fraudDetectionService.getFraudReports(userId);
  }

  @Get('report/:id')
  async getFraudReport(@Param('id') id: string) {
    const report = await this.fraudDetectionService.getFraudReportById(id);
    
    if (!report) {
      return { success: false, message: 'Fraud report not found' };
    }
    
    return { success: true, report };
  }
}
