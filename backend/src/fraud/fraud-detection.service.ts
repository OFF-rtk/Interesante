import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { Repository } from 'typeorm';
import { Certificate } from '../database/entities/certificate.entity';
import { FraudReport } from '../database/entities/fraud-report.entity';

export interface CreateFraudReportDto {
  certificateId: string;
  reporterEmail: string;
  reporterName: string;
  fraudDescription: string;
  evidence: {
    originalUploadDate?: string;
    originalPlatform?: string;
    originalUrl?: string;
    socialProof?: string;
    additionalEvidence?: string[];
  };
  reporterIpAddress: string;
}

@Injectable()
export class FraudDetectionService {
  constructor(
    @InjectRepository(FraudReport)
    private fraudReportRepository: Repository<FraudReport>,
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
    private auditLogService: AuditLogService,
  ) {}

  async reportFraud(reportData: CreateFraudReportDto, reporterUserId?: string) {
    // Validate certificate exists
    const certificate = await this.certificateRepository.findOne({
      where: { certificateId: reportData.certificateId }
    });

    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }

    if (certificate.status === 'REVOKED') {
      throw new HttpException('Certificate is already revoked', HttpStatus.BAD_REQUEST);
    }

    // Create fraud report
    const fraudReport = await this.fraudReportRepository.save({
      reportedCertificateId: certificate.id,
      reporterUserId: reporterUserId || 'anonymous',
      reporterEmail: reportData.reporterEmail,
      reporterName: reportData.reporterName,
      fraudDescription: reportData.fraudDescription,
      evidence: {
        ...reportData.evidence,
        reporterIpAddress: reportData.reporterIpAddress,
      },
      severity: this.calculateSeverity(reportData),
    });

    // Log the fraud report
    await this.auditLogService.log({
      userId: reporterUserId || 'anonymous',
      action: 'FRAUD_REPORTED',
      resourceType: 'CERTIFICATE',
      resourceId: certificate.id,
      metadata: {
        ipAddress: reportData.reporterIpAddress,
        userAgent: 'fraud-report-system',
        fraudReportId: fraudReport.id,
      },
      level: 'WARN',
    });

    // Auto-investigate high severity reports
    if (fraudReport.severity === 'HIGH' || fraudReport.severity === 'CRITICAL') {
      await this.autoInvestigate(fraudReport);
    }

    return fraudReport;
  }

  async revokeCertificate(certificateId: string, reason: string, revokedBy: string) {
    const certificate = await this.certificateRepository.findOne({
      where: { certificateId }
    });

    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }

    if (certificate.status === 'REVOKED') {
      throw new HttpException('Certificate is already revoked', HttpStatus.BAD_REQUEST);
    }

    // Revoke certificate
    await this.certificateRepository.update(certificate.id, {
      status: 'REVOKED',
      revocationReason: reason,
      revokedByUserId: revokedBy,
      revokedAt: new Date(),
    });

    // Log the revocation
    await this.auditLogService.log({
      userId: revokedBy,
      action: 'CERTIFICATE_REVOKED',
      resourceType: 'CERTIFICATE',
      resourceId: certificate.id,
      metadata: {
        ipAddress: 'system',
        userAgent: 'fraud-detection-system',
        reason: reason,
        previousStatus: certificate.status,
        newStatus: 'REVOKED',
      },
      level: 'CRITICAL',
    });

    return {
      success: true,
      message: 'Certificate revoked successfully',
      certificateId: certificate.certificateId,
      revokedAt: new Date(),
    };
  }

  private calculateSeverity(reportData: CreateFraudReportDto): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let score = 0;
  
    // Evidence quality scoring
    if (reportData.evidence.originalUrl) score += 2;
    if (reportData.evidence.socialProof) score += 2;
    if (reportData.evidence.originalUploadDate) score += 1;
    
    // 🔧 FIXED: Safe check for additionalEvidence
    if (reportData.evidence.additionalEvidence && reportData.evidence.additionalEvidence.length > 0) score += 1;
  
    // Description quality
    if (reportData.fraudDescription.length > 100) score += 1;
  
    if (score >= 5) return 'CRITICAL';
    if (score >= 3) return 'HIGH';
    if (score >= 1) return 'MEDIUM';
    return 'LOW';
  }

  private async autoInvestigate(fraudReport: FraudReport) {
    // Auto-investigation logic for high severity reports
    const investigation = {
      investigatedBy: 'auto-system',
      investigatedAt: new Date(),
      findings: 'Automatic investigation triggered due to high severity',
      action: 'PENDING_MANUAL_REVIEW',
    };

    await this.fraudReportRepository.update(fraudReport.id, {
      investigation,
      status: 'INVESTIGATING',
    });
  }

  async getFraudReports(userId?: string) {
    const where = userId ? { reporterUserId: userId } : {};
    
    return this.fraudReportRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getFraudReportById(id: string) {
    return this.fraudReportRepository.findOne({ where: { id } });
  }
}
