import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import FormData from 'form-data';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import fetch, { Response } from 'node-fetch';
import PDFDocument from 'pdfkit';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { Repository } from 'typeorm';
import { Certificate } from '../database/entities/certificate.entity';

// Define interfaces for type safety
interface AIServiceResponse {
  status: string;
  certificate?: {
    file_info: {
      original_filename: string;
      file_size: number;
      sha256_hash: string;
    };
    content_analysis: {
      video_duration: number;
      frames_analyzed: number;
      content_hashes: Array<{
        frame_index: number;
        timestamp: number;
        phash: string;
        dct_hash: string;
        advanced_features: Record<string, any>;
        tf_embedding?: number[];
      }>;
    };
    technical_metadata: {
      processing_engine: string;
      algorithms_used: string[];
      tensorflow_available: boolean;
      generation_timestamp: string;
    };
    certificate_id: string;
    timestamp: string;
  };
  error?: string;
}

interface CertificateData {
  certificateId: string;
  certificateHash: string;
  verificationUrl: string;
  timestamp: string;
  file_info: {
    original_filename: string;
    file_size: number;
    sha256_hash: string;
  };
  content_analysis: {
    video_duration: number;
    frames_analyzed: number;
    content_hashes: any[];
  };
  technical_metadata: {
    processing_engine: string;
    algorithms_used: string[];
    tensorflow_available: boolean;
  };
  userAgreement: {
    tosVersion: string;
    acceptedAt: Date;
    userOwnershipWarranty: boolean;
    platformDisclaimerAccepted: boolean;
  };
}

// 🆕 User Agreement Interface
interface UserAgreement {
  tosVersion: string;
  userOwnershipWarranty: boolean;
  platformDisclaimerAccepted: boolean;
  ipAddress: string;
  userAgent: string;
}

// Type guard function to validate AI service response
function isValidAIServiceResponse(data: unknown): data is AIServiceResponse {
  if (typeof data !== 'object' || data === null) return false;
  
  const response = data as Record<string, unknown>;
  
  if (typeof response.status !== 'string') return false;
  
  if (response.status === 'success') {
    if (typeof response.certificate !== 'object' || response.certificate === null) return false;
    
    const cert = response.certificate as Record<string, unknown>;
    
    // Validate required certificate structure
    return (
      typeof cert.file_info === 'object' &&
      cert.file_info !== null &&
      typeof cert.content_analysis === 'object' &&
      cert.content_analysis !== null &&
      typeof cert.technical_metadata === 'object' &&
      cert.technical_metadata !== null
    );
  }
  
  return true; // Error responses just need status
}

// Custom error classes for proper error handling
class CertificateGenerationError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'CertificateGenerationError';
  }
}

class AIServiceError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'AIServiceError';
  }
}

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
    private auditLogService: AuditLogService,
  ) {}

  // 🆕 UPDATED METHOD WITH LEGAL COMPLIANCE
  async generateCertificate(
    file: Express.Multer.File, 
    userId: string, 
    userAgreement: UserAgreement
  ) {
    let tempPath: string | null = null;
    
    try {
      // 🆕 VALIDATE USER AGREEMENT FIRST
      if (!userAgreement.userOwnershipWarranty || !userAgreement.platformDisclaimerAccepted) {
        throw new HttpException(
          'User must accept ownership warranty and platform disclaimers', 
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate file buffer exists
      if (!file.buffer || file.buffer.length === 0) {
        throw new CertificateGenerationError('Invalid file: no content found');
      }

      // Validate file size (safe number conversion)
      const fileSize = Number(file.size);
      if (!Number.isInteger(fileSize) || fileSize <= 0) {
        throw new CertificateGenerationError('Invalid file size');
      }

      // Save file temporarily with safe string handling
      const safeFilename = String(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
      tempPath = `/tmp/${Date.now()}_${safeFilename}`;
      writeFileSync(tempPath, file.buffer);

      // Call AI service with proper FormData for Node.js
      const formData = new FormData();
      formData.append('video', createReadStream(tempPath), {
        filename: safeFilename,
        contentType: String(file.mimetype || 'video/mp4'),
      });

      const response: Response = await fetch('http://ai-service:5000/generate-certificate', {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Safe status code handling
      const statusCode = Number(response.status);
      if (!response.ok || !Number.isInteger(statusCode)) {
        throw new AIServiceError(
          `AI service returned status ${statusCode}`, 
          statusCode
        );
      }

      // Safe JSON parsing with type validation
      const rawResponse: unknown = await response.json();
      
      if (!isValidAIServiceResponse(rawResponse)) {
        throw new AIServiceError('Invalid response format from AI service');
      }

      const aiResult: AIServiceResponse = rawResponse;
      
      if (aiResult.status !== 'success' || !aiResult.certificate) {
        throw new AIServiceError(aiResult.error || 'AI service returned error');
      }

      // Safe string operations with validation
      const fileHash = String(aiResult.certificate.file_info.sha256_hash);
      if (fileHash.length < 16) {
        throw new AIServiceError('Invalid file hash format');
      }

      // Generate certificate ID and hash - use AI service data if available
      const certificateId = aiResult.certificate.certificate_id || 
        `CS-${Date.now()}-${fileHash.substring(0, 16)}`;
        
      const certificateHash = createHash('sha256')
        .update(JSON.stringify(aiResult.certificate))
        .digest('hex');

      // Safe number conversion for database
      const videoDuration = Number(aiResult.certificate.content_analysis.video_duration);
      if (!Number.isFinite(videoDuration)) {
        throw new AIServiceError('Invalid video duration format');
      }

      // 🆕 SAVE TO DATABASE WITH LEGAL COMPLIANCE DATA
      const certificate = this.certificateRepository.create({
        certificateId,
        userId: String(userId),
        originalFilename: String(file.originalname),
        fileSize: fileSize,
        sha256Hash: fileHash,
        videoDuration: videoDuration,
        contentHashes: aiResult.certificate.content_analysis.content_hashes,
        technicalMetadata: aiResult.certificate.technical_metadata,
        certificateHash,
        // 🆕 Legal compliance fields
        userAgreement: {
          tosVersion: userAgreement.tosVersion,
          acceptedAt: new Date(),
          userOwnershipWarranty: userAgreement.userOwnershipWarranty,
          platformDisclaimerAccepted: userAgreement.platformDisclaimerAccepted,
          ipAddress: userAgreement.ipAddress,
          userAgent: userAgreement.userAgent,
        },
        certificateType: 'TECHNICAL_EVIDENCE_ONLY',
        status: 'ACTIVE',
      });

      await this.certificateRepository.save(certificate);

      // 🆕 LOG CERTIFICATE CREATION TO AUDIT TRAIL
      await this.auditLogService.log({
        userId: String(userId),
        action: 'CERTIFICATE_CREATED',
        resourceType: 'CERTIFICATE',
        resourceId: certificate.id,
        metadata: {
          ipAddress: userAgreement.ipAddress,
          userAgent: userAgreement.userAgent,
          certificateId: certificate.certificateId,
          fileSize: fileSize,
          filename: String(file.originalname),
          tosVersion: userAgreement.tosVersion,
          ownershipWarranty: userAgreement.userOwnershipWarranty,
        },
        level: 'INFO',
      });

      // 🆕 GENERATE PDF WITH ENHANCED LEGAL DISCLAIMERS
      const pdfBuffer = await this.generatePDFWithLegalDisclaimers({
        ...aiResult.certificate,
        certificateId,
        certificateHash,
        verificationUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${certificateId}`,
        timestamp: aiResult.certificate.timestamp || new Date().toISOString(),
        userAgreement: {
          tosVersion: userAgreement.tosVersion,
          acceptedAt: new Date(),
          userOwnershipWarranty: userAgreement.userOwnershipWarranty,
          platformDisclaimerAccepted: userAgreement.platformDisclaimerAccepted,
        }
      });

      return {
        certificate: {
          id: certificateId,
          downloadUrl: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
          metadata: {
            filename: String(file.originalname),
            fileSize: fileSize,
            duration: videoDuration,
            createdAt: certificate.createdAt,
            technicalEvidence: true,
            legalCompliance: true,
            contentHashes: aiResult.certificate.content_analysis.content_hashes.length,
            algorithms: aiResult.certificate.technical_metadata.algorithms_used,
          }
        }
      };

    } catch (error) {
      // 🆕 LOG FAILED CERTIFICATE ATTEMPTS
      await this.auditLogService.log({
        userId: String(userId),
        action: 'CERTIFICATE_CREATION_FAILED',
        resourceType: 'CERTIFICATE',
        resourceId: 'unknown',
        metadata: {
          ipAddress: userAgreement?.ipAddress || 'unknown',
          userAgent: userAgreement?.userAgent || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          filename: String(file?.originalname || 'unknown'),
          fileSize: Number(file?.size || 0),
        },
        level: 'ERROR',
      });

      // Proper error handling with Error objects
      if (error instanceof AIServiceError || error instanceof CertificateGenerationError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      if (error instanceof Error) {
        throw new HttpException(
          `Certificate generation failed: ${error.message}`, 
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      
      // Handle unknown errors
      throw new HttpException(
        'An unexpected error occurred during certificate generation', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      // Clean up temp file
      if (tempPath) {
        try {
          unlinkSync(tempPath);
        } catch (cleanupError) {
          // Log cleanup error but don't throw
          console.warn('Failed to cleanup temp file:', cleanupError);
        }
      }
    }
  }

  // 🆕 ENHANCED PDF GENERATION WITH COMPREHENSIVE LEGAL DISCLAIMERS
  private async generatePDFWithLegalDisclaimers(certificateData: CertificateData): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (error: Error) => reject(new CertificateGenerationError(
          'PDF generation failed', 
          error
        )));
        
        // Safe string conversions for PDF content
        const certificateId = String(certificateData.certificateId);
        const timestamp = String(certificateData.timestamp);
        const filename = String(certificateData.file_info.original_filename);
        const fileSize = Number(certificateData.file_info.file_size);
        const fileHash = String(certificateData.file_info.sha256_hash);
        const duration = Number(certificateData.content_analysis.video_duration);
        const framesCount = Number(certificateData.content_analysis.frames_analyzed);
        
        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('COPYRIGHT SHIELD', { align: 'center' })
           .fontSize(18)
           .text('Technical Evidence Certificate', { align: 'center' });
        
        doc.moveDown();
        
        // Certificate Info
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Certificate ID: ${certificateId}`)
           .text(`Issue Date: ${new Date(timestamp).toLocaleString()}`)
           .text('Issued by: Copyright Shield AI Engine v1.0');

        doc.moveDown();
        
        // File Information
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('CERTIFIED CONTENT DETAILS');
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Original Filename: ${filename}`)
           .text(`File Size: ${fileSize.toLocaleString()} bytes`)
           .text(`SHA-256 Hash: ${fileHash}`);

        doc.moveDown();

        // Content Analysis
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('TECHNICAL ANALYSIS SUMMARY');
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Video Duration: ${duration.toFixed(2)} seconds`)
           .text(`Frames Analyzed: ${framesCount}`)
           .text(`Content Fingerprints: ${certificateData.content_analysis.content_hashes.length}`)
           .text(`Algorithms Applied: ${certificateData.technical_metadata.algorithms_used.join(', ')}`);

        // Advanced Features Summary
        if (Array.isArray(certificateData.content_analysis.content_hashes) && 
            certificateData.content_analysis.content_hashes.length > 0) {
          doc.moveDown();
          doc.text('FRAME-BY-FRAME FINGERPRINTS:');
          
          certificateData.content_analysis.content_hashes.slice(0, 5).forEach((frame) => {
            const frameIndex = Number(frame.frame_index) || 0;
            const frameTime = Number(frame.timestamp) || 0;
            const phashPreview = String(frame.phash || 'N/A').substring(0, 16);
            const dctPreview = String(frame.dct_hash || 'N/A').substring(0, 16);
            doc.text(`Frame ${frameIndex}: ${frameTime.toFixed(1)}s - pHash: ${phashPreview}... DCT: ${dctPreview}...`);
          });
        }

        doc.moveDown();

        // 🆕 COMPREHENSIVE LEGAL DISCLAIMERS SECTION
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('red')
           .text('IMPORTANT LEGAL DISCLAIMERS', { align: 'center' });

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('black')
           .text(`
TECHNICAL EVIDENCE ONLY: This certificate provides cryptographic analysis and technical fingerprinting only. It does not constitute legal advice, ownership verification, or legal determination of copyright.

NO OWNERSHIP VERIFICATION: Copyright Shield does not verify, warrant, or guarantee actual ownership of the content. The platform relies solely on user representations.

USER WARRANTY: The certificate holder warranted ownership of the uploaded content and accepted full responsibility for accuracy of ownership claims.

PLATFORM DISCLAIMER: Copyright Shield disclaims all liability for fraudulent certificates, misrepresentation of ownership, or any legal consequences arising from certificate use.

INTERNATIONAL VARIATIONS: Legal recognition and weight of this technical evidence may vary significantly by jurisdiction and local copyright laws.

NOT LEGAL ADVICE: This certificate does not constitute legal counsel. For copyright disputes, consult qualified legal professionals in your jurisdiction.

EVIDENCE LIMITATION: This certificate serves as technical evidence only and does not replace proper copyright registration, legal documentation, or court proceedings.

FRAUD REPORTING: Suspected fraudulent certificates can be reported through our fraud detection system for investigation and potential revocation.

LIABILITY LIMITATION: Copyright Shield's liability is limited to the technical service provided and does not extend to legal outcomes or disputes.

DISPUTE RESOLUTION: Certificate disputes should be resolved through appropriate legal channels with qualified legal representation.
           `, { 
             width: 500, 
             align: 'left',
             lineGap: 3 
           });

        doc.moveDown();

        // 🆕 USER AGREEMENT ACKNOWLEDGMENT
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('CERTIFICATE HOLDER ACKNOWLEDGMENT');
           
        doc.fontSize(10)
           .font('Helvetica')
           .text(`✓ User warranted ownership of uploaded content`)
           .text(`✓ User accepted Terms of Service v${certificateData.userAgreement.tosVersion}`)
           .text(`✓ User acknowledged technical evidence nature only`)
           .text(`✓ User accepted platform disclaimers and limitations`)
           .text(`✓ Agreement accepted on: ${certificateData.userAgreement.acceptedAt.toLocaleString()}`);

        doc.moveDown();

        // Technical Metadata
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('TECHNICAL METADATA');
        
        const engine = String(certificateData.technical_metadata.processing_engine);
        const algorithms = Array.isArray(certificateData.technical_metadata.algorithms_used) 
          ? certificateData.technical_metadata.algorithms_used.join(', ')
          : 'N/A';
        const tfAvailable = Boolean(certificateData.technical_metadata.tensorflow_available);
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Processing Engine: ${engine}`)
           .text(`Algorithms Used: ${algorithms}`)
           .text(`AI Analysis: ${tfAvailable ? 'Advanced TensorFlow Features Enabled' : 'Basic Analysis Only'}`);

        doc.moveDown();

        // Verification
        const verificationUrl = String(certificateData.verificationUrl);
        const certHash = String(certificateData.certificateHash);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('CERTIFICATE VERIFICATION');
           
        doc.fontSize(9)
           .font('Helvetica')
           .text(`Verification URL: ${verificationUrl}`)
           .text(`Certificate Hash: ${certHash.substring(0, 32)}...`)
           .text(`Certificate Type: TECHNICAL_EVIDENCE_ONLY`);

        doc.moveDown();
        
        // Footer
        doc.fontSize(8)
           .font('Helvetica')
           .text('Generated by Copyright Shield AI v1.0 • Technical Evidence Only • Not Legal Advice', { align: 'center' })
           .text('For legal matters, consult qualified legal counsel', { align: 'center' });

        doc.end();

      } catch (error) {
        reject(new CertificateGenerationError(
          'PDF generation setup failed', 
          error
        ));
      }
    });
  }

  async verifyCertificate(certificateId: string) {
    // Safe string validation
    const safeId = String(certificateId).trim();
    if (!safeId) {
      throw new HttpException('Invalid certificate ID', HttpStatus.BAD_REQUEST);
    }

    const certificate = await this.certificateRepository.findOne({
      where: { certificateId: safeId }
    });

    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }

    // 🆕 LOG VERIFICATION ATTEMPTS
    await this.auditLogService.log({
      userId: 'public',
      action: 'CERTIFICATE_VERIFIED',
      resourceType: 'CERTIFICATE',
      resourceId: certificate.id,
      metadata: {
        ipAddress: 'unknown', // Could be passed from controller
        userAgent: 'verification-system',
        certificateId: certificate.certificateId,
        verificationResult: certificate.status,
      },
      level: 'INFO',
    });

    return {
      valid: certificate.status === 'ACTIVE',
      certificate: {
        id: certificate.certificateId,
        createdAt: certificate.createdAt,
        filename: certificate.originalFilename,
        status: certificate.status,
        certificateType: certificate.certificateType,
        technicalEvidence: true,
        legalDisclaimer: 'This certificate provides technical evidence only and does not constitute legal advice or ownership verification.'
      }
    };
  }

  async getUserCertificates(userId: string) {
    // Safe string validation
    const safeUserId = String(userId).trim();
    if (!safeUserId) {
      throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
    }

    const certificates = await this.certificateRepository.find({
      where: { userId: safeUserId },
      order: { createdAt: 'DESC' }
    });

    // 🆕 LOG USER CERTIFICATE ACCESS
    await this.auditLogService.log({
      userId: safeUserId,
      action: 'USER_CERTIFICATES_ACCESSED',
      resourceType: 'CERTIFICATE',
      resourceId: 'bulk',
      metadata: {
        ipAddress: 'unknown', // Could be passed from controller
        userAgent: 'user-dashboard',
        certificateCount: certificates.length,
      },
      level: 'INFO',
    });

    return certificates.map(cert => ({
      id: cert.certificateId,
      filename: cert.originalFilename,
      createdAt: cert.createdAt,
      status: cert.status,
      fileSize: cert.fileSize,
      videoDuration: cert.videoDuration,
      certificateType: cert.certificateType,
    }));
  }
}
