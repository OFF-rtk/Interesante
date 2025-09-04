// src/agents/detective/services/evidence-compiler.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoProcessing } from '../../../database/entities/video-processing.entity';
import { SuspectVideo } from '../../../database/entities/suspect-video.entity';
import { VideoKeyframe } from '../../../database/entities/video-keyframe.entity';
import { VideoMetadata } from '../../../database/entities/video-metadata.entity';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export interface EvidenceReport {
  caseId: string;
  reportId: string;
  generatedAt: Date;
  summary: {
    originalVideo: {
      title: string;
      youtubeUrl: string;
      channelName: string;
      publishDate: Date;
      duration: number;
      viewCount: number;
    };
    detectionResults: {
      totalSuspectsAnalyzed: number;
      highRiskMatches: number;
      mediumRiskMatches: number;
      lowRiskMatches: number;
      strongestMatch: {
        confidence: number;
        youtubeUrl: string;
        title: string;
      };
    };
    analysis: {
      processingTime: string;
      framesAnalyzed: number;
      algorithmsUsed: string[];
      confidenceThreshold: number;
    };
  };
  suspects: Array<{
    rank: number;
    youtubeVideoId: string;
    title: string;
    channelName: string;
    youtubeUrl: string;
    riskLevel: string;
    confidence: number;
    similarity: number;
    temporalAlignment: number;
    evidence: {
      sequenceMatches: Array<{
        timeRange: string;
        confidence: number;
        frameCount: number;
        description: string;
      }>;
      algorithmDetails: {
        perceptualSimilarity: number;
        dctSimilarity: number;
        semanticSimilarity: number;
        advancedFeatures: number;
      };
    };
    legalNotes: string[];
  }>;
  technicalDetails: {
    methodology: string;
    algorithms: string[];
    thresholds: Record<string, number>;
    qualityMetrics: {
      frameExtraction: string;
      hashGeneration: string;
      similarityAnalysis: string;
    };
  };
  recommendations: {
    immediate: string[];
    followUp: string[];
    legal: string[];
  };
  appendices: {
    algorithmExplanation: string;
    confidenceScoring: string;
    limitations: string;
  };
}

export interface LegalNotice {
  noticeId: string;
  platform: 'youtube' | 'dmca' | 'custom';
  caseId: string;
  suspectVideoId: string;
  content: {
    subject: string;
    body: string;
    evidence: string[];
    demands: string[];
  };
  status: 'draft' | 'sent' | 'acknowledged' | 'disputed';
  createdAt: Date;
  sentAt?: Date;
  responseAt?: Date;
}

@Injectable()
export class EvidenceCompilerService {
  private readonly logger = new Logger('📋 EvidenceCompiler');

  constructor(
    @InjectRepository(VideoProcessing)
    private readonly videoProcessingRepo: Repository<VideoProcessing>,

    @InjectRepository(SuspectVideo)
    private readonly suspectVideoRepo: Repository<SuspectVideo>,

    @InjectRepository(VideoKeyframe)
    private readonly videoKeyframeRepo: Repository<VideoKeyframe>,

    @InjectRepository(VideoMetadata)
    private readonly videoMetadataRepo: Repository<VideoMetadata>,
  ) {}

  /**
   * Generate comprehensive evidence report
   */
  public async generateEvidenceReport(caseId: string): Promise<EvidenceReport> {
    try {
      this.logger.log(`📋 Generating evidence report for case: ${caseId}`);

      // Load case data
      const caseData = await this.loadCaseData(caseId);
      const suspects = await this.loadSuspectData(caseId);
      const keyframes = await this.loadKeyframeData(caseId);

      // Generate report sections
      const report: EvidenceReport = {
        caseId,
        reportId: this.generateReportId(),
        generatedAt: new Date(),
        summary: this.generateSummary(caseData, suspects),
        suspects: this.compileSuspectEvidence(suspects),
        technicalDetails: this.generateTechnicalDetails(keyframes),
        recommendations: this.generateRecommendations(suspects),
        appendices: this.generateAppendices()
      };

      this.logger.log(`✅ Evidence report generated: ${report.reportId} at ${report.generatedAt.toISOString()}`);
      return report;

    } catch (error) {
      this.logger.error(`❌ Evidence report generation failed: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Generate DMCA takedown notice
   */
  public async generateDmcaNotice(
    caseId: string,
    suspectVideoId: string,
    claimantInfo: {
      name: string;
      email: string;
      address: string;
      phone?: string;
    }
  ): Promise<LegalNotice> {
    try {
      const suspect = await this.suspectVideoRepo.findOne({
        where: { id: suspectVideoId, videoProcessing: { id: caseId } },
        relations: ['videoProcessing', 'videoProcessing.metadata']
      });

      if (!suspect) {
        throw new Error(`Suspect video ${suspectVideoId} not found for case ${caseId}`);
      }

      const notice: LegalNotice = {
        noticeId: this.generateNoticeId(),
        platform: 'dmca',
        caseId,
        suspectVideoId,
        content: {
          subject: `DMCA Takedown Notice - Copyright Infringement: ${suspect.title}`,
          body: this.generateDmcaBody(suspect, claimantInfo),
          evidence: this.compileEvidenceUrls(suspect),
          demands: [
            'Immediate removal of the infringing content',
            'Disable access to the infringing material',
            'Prevent future uploads of the same content',
            'Provide confirmation of removal within 24 hours'
          ]
        },
        status: 'draft',
        createdAt: new Date()
      };

      this.logger.log(`✅ DMCA notice generated: ${notice.noticeId}`);
      return notice;

    } catch (error) {
      this.logger.error(`❌ DMCA notice generation failed: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Generate YouTube copyright claim
   */
  public async generateYouTubeClaim(
    caseId: string,
    suspectVideoId: string
  ): Promise<LegalNotice> {
    try {
      const suspect = await this.suspectVideoRepo.findOne({
        where: { id: suspectVideoId, videoProcessing: { id: caseId } },
        relations: ['videoProcessing', 'videoProcessing.metadata']
      });

      if (!suspect) {
        throw new Error(`Suspect video ${suspectVideoId} not found`);
      }

      const notice: LegalNotice = {
        noticeId: this.generateNoticeId(),
        platform: 'youtube',
        caseId,
        suspectVideoId,
        content: {
          subject: `YouTube Copyright Claim: ${suspect.title}`,
          body: this.generateYouTubeClaimBody(suspect),
          evidence: this.compileEvidenceUrls(suspect),
          demands: [
            'Content ID claim submission',
            'Revenue redirection to rightful owner',
            'Removal of infringing content',
            'Strike against uploading channel'
          ]
        },
        status: 'draft',
        createdAt: new Date()
      };

      return notice;

    } catch (error) {
      this.logger.error(`❌ YouTube claim generation failed: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * 🚀 REFACTORED: Export report to PDF using PDFKit
   */
  public async exportToPdf(report: EvidenceReport): Promise<Buffer> {
    this.logger.log(`📄 Generating professional PDF for report ${report.reportId}`);
    
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        const chunks: Buffer[] = [];

        // Collect PDF data chunks
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          this.logger.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        });
        doc.on('error', (error: Error) => {
          this.logger.error(`❌ PDF generation failed: ${error.message}`);
          reject(error);
        });

        // Generate comprehensive PDF content
        this.generatePdfContent(doc, report);
        
        // Finalize PDF
        doc.end();

      } catch (error) {
        this.logger.error(`❌ PDF export failed: ${this.getErrorMessage(error)}`);
        reject(error instanceof Error ? error: new Error(this.getErrorMessage(error)));
      }
    });
  }

  /**
   * 🚀 REFACTORED: Export report to Word using docx library
   */
  public async exportToWord(report: EvidenceReport): Promise<Buffer> {
    this.logger.log(`📄 Generating professional Word document for report ${report.reportId}`);
    
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: this.generateWordContent(report)
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      this.logger.log(`✅ Word document generated successfully: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      this.logger.error(`❌ Word export failed: ${this.getErrorMessage(error)}`);
      throw new Error(`Failed to export Word document: ${this.getErrorMessage(error)}`);
    }
  }

  // Private methods for PDF generation
  private generatePdfContent(doc: PDFKit.PDFDocument, report: EvidenceReport): void {
    let yPosition = 50;

    // Header with styling
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#1a472a')
       .text('COPYRIGHT INFRINGEMENT EVIDENCE REPORT', 50, yPosition, { align: 'center' });
    
    yPosition += 50;

    // Report metadata section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('REPORT INFORMATION', 50, yPosition);
    
    yPosition += 25;

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000')
       .text(`Report ID: ${report.reportId}`, 50, yPosition)
       .text(`Generated: ${report.generatedAt.toLocaleString()}`, 50, yPosition + 15)
       .text(`Case ID: ${report.caseId}`, 50, yPosition + 30);

    yPosition += 70;

    // Executive Summary
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#c0392b')
       .text('EXECUTIVE SUMMARY', 50, yPosition);
    
    yPosition += 30;

    // Original video information
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('Original Video Information:', 50, yPosition);
    
    yPosition += 20;

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000')
       .text(`Title: ${report.summary.originalVideo.title}`, 60, yPosition)
       .text(`Channel: ${report.summary.originalVideo.channelName}`, 60, yPosition + 12)
       .text(`Duration: ${this.formatDuration(report.summary.originalVideo.duration)}`, 60, yPosition + 24)
       .text(`Views: ${report.summary.originalVideo.viewCount.toLocaleString()}`, 60, yPosition + 36);

    yPosition += 65;

    // Detection Results
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('Detection Results:', 50, yPosition);
    
    yPosition += 20;

    const results = report.summary.detectionResults;
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000')
       .text(`Total Suspects Analyzed: ${results.totalSuspectsAnalyzed}`, 60, yPosition);
    
    // Color-coded risk levels
    doc.text(`High Risk Matches: ${results.highRiskMatches}`, 60, yPosition + 12)
       .fillColor('#e74c3c');
    doc.fillColor('#000000')
       .text(`Medium Risk Matches: ${results.mediumRiskMatches}`, 60, yPosition + 24)
       .fillColor('#f39c12');
    doc.fillColor('#000000')
       .text(`Low Risk Matches: ${results.lowRiskMatches}`, 60, yPosition + 36)
       .fillColor('#95a5a6');

    yPosition += 65;

    // Strongest Match (if exists)
    if (results.strongestMatch.confidence > 0) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#e74c3c')
         .text(`STRONGEST MATCH: ${(results.strongestMatch.confidence * 100).toFixed(1)}% Confidence`, 50, yPosition);
      
      yPosition += 20;

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text(`Title: ${results.strongestMatch.title}`, 60, yPosition)
         .text(`URL: ${results.strongestMatch.youtubeUrl}`, 60, yPosition + 12);

      yPosition += 35;
    }

    // Add new page for suspects
    doc.addPage();
    yPosition = 50;

    // Suspect Analysis Section
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#8e44ad')
       .text('DETAILED SUSPECT ANALYSIS', 50, yPosition);
    
    yPosition += 40;

    report.suspects.slice(0, 10).forEach((suspect) => { // Limit to top 10 for PDF space
      // Check if we need a new page
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      // Suspect header with rank
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(`${suspect.rank}. ${suspect.title}`, 50, yPosition);
      
      yPosition += 20;

      // Channel and URL info
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text(`Channel: ${suspect.channelName}`, 50, yPosition)
         .text(`URL: ${suspect.youtubeUrl}`, 50, yPosition + 10);

      yPosition += 25;

      // Risk and confidence metrics with color coding
      const riskColor = this.getRiskColor(suspect.riskLevel);
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(riskColor)
         .text(`Risk Level: ${suspect.riskLevel}`, 50, yPosition)
         .fillColor('#000000')
         .text(`Confidence: ${(suspect.confidence * 100).toFixed(1)}%`, 150, yPosition)
         .text(`Similarity: ${(suspect.similarity * 100).toFixed(1)}%`, 250, yPosition)
         .text(`Temporal: ${(suspect.temporalAlignment * 100).toFixed(1)}%`, 350, yPosition);

      yPosition += 20;

      // Evidence summary
      if (suspect.evidence.sequenceMatches.length > 0) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#34495e')
           .text('Key Evidence:', 50, yPosition);
        
        yPosition += 12;

        suspect.evidence.sequenceMatches.slice(0, 2).forEach(match => {
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#000000')
             .text(`• ${match.timeRange} - ${(match.confidence * 100).toFixed(1)}% confidence (${match.frameCount} frames)`, 60, yPosition);
          yPosition += 10;
        });
      }

      // Legal notes
      if (suspect.legalNotes.length > 0) {
        yPosition += 5;
        doc.fontSize(9)
           .font('Helvetica-Oblique')
           .fillColor('#7f8c8d')
           .text(`Legal Note: ${suspect.legalNotes[0]}`, 50, yPosition);
        yPosition += 12;
      }

      yPosition += 20;
    });

    // Technical Details Page
    doc.addPage();
    yPosition = 50;

    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#27ae60')
       .text('TECHNICAL METHODOLOGY', 50, yPosition);
    
    yPosition += 40;

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000')
       .text(report.technicalDetails.methodology, 50, yPosition, { 
         width: 500,
         align: 'justify'
       });

    yPosition += 80;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('Algorithms Employed:', 50, yPosition);
    
    yPosition += 25;

    report.technicalDetails.algorithms.forEach(algorithm => {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text(`• ${algorithm}`, 60, yPosition);
      yPosition += 15;
    });

    yPosition += 20;

    // Thresholds table
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('Detection Thresholds:', 50, yPosition);
    
    yPosition += 25;

    Object.entries(report.technicalDetails.thresholds).forEach(([key, value]) => {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text(`${key}: ${(value * 100).toFixed(1)}%`, 60, yPosition);
      yPosition += 12;
    });

    // Footer on last page
    doc.fontSize(8)
       .fillColor('#7f8c8d')
       .text(`Generated by Detective Agent Copyright Detection System - ${new Date().toLocaleDateString()}`, 50, 750);
  }

  // Private methods for Word generation
  private generateWordContent(report: EvidenceReport): Paragraph[] {
    const content: Paragraph[] = [];

    // Title page
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'COPYRIGHT INFRINGEMENT EVIDENCE REPORT',
            bold: true,
            size: 32,
            color: '1a472a'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Report Information
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'REPORT INFORMATION', bold: true, size: 24, color: '2c3e50' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 }
      })
    );

    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Report ID: ${report.reportId}`, bold: true }),
          new TextRun({ text: `\nGenerated: ${report.generatedAt.toLocaleString()}` }),
          new TextRun({ text: `\nCase ID: ${report.caseId}` })
        ],
        spacing: { after: 300 }
      })
    );

    // Executive Summary
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'EXECUTIVE SUMMARY', bold: true, size: 24, color: 'c0392b' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    // Original Video Information
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Original Video Information', bold: true, size: 20, color: '34495e' })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );

    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Title: ${report.summary.originalVideo.title}`, bold: true }),
          new TextRun({ text: `\nChannel: ${report.summary.originalVideo.channelName}` }),
          new TextRun({ text: `\nDuration: ${this.formatDuration(report.summary.originalVideo.duration)}` }),
          new TextRun({ text: `\nViews: ${report.summary.originalVideo.viewCount.toLocaleString()}` }),
          new TextRun({ text: `\nPublished: ${report.summary.originalVideo.publishDate.toLocaleDateString()}` })
        ],
        spacing: { after: 300 }
      })
    );

    // Detection Results
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Detection Results', bold: true, size: 20, color: '34495e' })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );

    const results = report.summary.detectionResults;
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Total Suspects Analyzed: ${results.totalSuspectsAnalyzed}`, bold: true }),
          new TextRun({ text: `\nHigh Risk Matches: ${results.highRiskMatches}`, color: 'e74c3c', bold: true }),
          new TextRun({ text: `\nMedium Risk Matches: ${results.mediumRiskMatches}`, color: 'f39c12', bold: true }),
          new TextRun({ text: `\nLow Risk Matches: ${results.lowRiskMatches}`, color: '95a5a6', bold: true })
        ],
        spacing: { after: 300 }
      })
    );

    // Strongest Match
    if (results.strongestMatch.confidence > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: `STRONGEST MATCH: ${(results.strongestMatch.confidence * 100).toFixed(1)}% Confidence`, 
              bold: true, 
              color: 'e74c3c',
              size: 24 
            }),
            new TextRun({ text: `\nTitle: ${results.strongestMatch.title}` }),
            new TextRun({ text: `\nURL: ${results.strongestMatch.youtubeUrl}`, color: '0000FF' })
          ],
          spacing: { before: 200, after: 400 }
        })
      );
    }

    // Suspect Analysis
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'DETAILED SUSPECT ANALYSIS', bold: true, size: 24, color: '8e44ad' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    report.suspects.forEach((suspect, index) => {
      if (index >= 20) return; // Limit for document size

      // Suspect header
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${suspect.rank}. ${suspect.title}`, bold: true, size: 20, color: '2c3e50' })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        })
      );

      // Basic info
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Channel: ${suspect.channelName}`, bold: true }),
            new TextRun({ text: `\nURL: ${suspect.youtubeUrl}`, color: '0000FF' }),
            new TextRun({ text: `\nRisk Level: ${suspect.riskLevel}`, bold: true, color: this.getWordRiskColor(suspect.riskLevel) }),
            new TextRun({ text: `\nConfidence Score: ${(suspect.confidence * 100).toFixed(1)}%` }),
            new TextRun({ text: `\nSimilarity Score: ${(suspect.similarity * 100).toFixed(1)}%` }),
            new TextRun({ text: `\nTemporal Alignment: ${(suspect.temporalAlignment * 100).toFixed(1)}%` })
          ],
          spacing: { after: 200 }
        })
      );

      // Evidence details
      if (suspect.evidence.sequenceMatches.length > 0) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Key Evidence:', bold: true, color: '34495e' }),
              ...suspect.evidence.sequenceMatches.slice(0, 3).map(match => 
                new TextRun({ text: `\n• ${match.timeRange} - ${(match.confidence * 100).toFixed(1)}% confidence (${match.frameCount} frames)` })
              )
            ],
            spacing: { after: 150 }
          })
        );
      }

      // Legal notes
      if (suspect.legalNotes.length > 0) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Legal Assessment:', bold: true, color: '34495e' }),
              ...suspect.legalNotes.map(note => 
                new TextRun({ text: `\n• ${note}`, italics: true })
              )
            ],
            spacing: { after: 300 }
          })
        );
      }
    });

    // Technical Details
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'TECHNICAL METHODOLOGY', bold: true, size: 24, color: '27ae60' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    content.push(
      new Paragraph({
        text: report.technicalDetails.methodology,
        spacing: { after: 300 }
      })
    );

    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Algorithms Employed:', bold: true, color: '34495e' }),
          ...report.technicalDetails.algorithms.map(algorithm => 
            new TextRun({ text: `\n• ${algorithm}` })
          )
        ],
        spacing: { after: 300 }
      })
    );

    // Recommendations
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'RECOMMENDATIONS', bold: true, size: 24, color: 'e67e22' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    if (report.recommendations.immediate.length > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Immediate Actions Required:', bold: true, color: 'c0392b' }),
            ...report.recommendations.immediate.map(action => 
              new TextRun({ text: `\n• ${action}` })
            )
          ],
          spacing: { after: 200 }
        })
      );
    }

    if (report.recommendations.legal.length > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Legal Considerations:', bold: true, color: '8e44ad' }),
            ...report.recommendations.legal.map(action => 
              new TextRun({ text: `\n• ${action}` })
            )
          ],
          spacing: { after: 200 }
        })
      );
    }

    // Footer
    content.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: `\n\nThis report was generated automatically by the Detective Agent Copyright Detection System on ${new Date().toLocaleDateString()}.`,
            italics: true,
            color: '7f8c8d',
            size: 16
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 }
      })
    );

    return content;
  }

  // Keep all your existing private methods exactly as they are:

  private async loadCaseData(caseId: string): Promise<VideoProcessing> {
    const caseData = await this.videoProcessingRepo.findOne({
      where: { id: caseId },
      relations: ['metadata', 'keyframes']
    });

    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    return caseData;
  }

  private async loadSuspectData(caseId: string): Promise<SuspectVideo[]> {
    return await this.suspectVideoRepo.find({
      where: { videoProcessing: { id: caseId } },
      order: { confidenceScore: 'DESC' }
    });
  }

  private async loadKeyframeData(caseId: string): Promise<VideoKeyframe[]> {
    return await this.videoKeyframeRepo.find({
      where: { videoProcessing: { id: caseId } },
      order: { frameTimestamp: 'ASC' }
    });
  }

  private generateSummary(caseData: VideoProcessing, suspects: SuspectVideo[]): EvidenceReport['summary'] {
    const highRisk = suspects.filter(s => s.riskLevel === 'HIGH');
    const mediumRisk = suspects.filter(s => s.riskLevel === 'MEDIUM');
    const lowRisk = suspects.filter(s => s.riskLevel === 'LOW');
    const strongest = suspects[0]; // Highest confidence (already sorted)

    return {
      originalVideo: {
        title: caseData.videoTitle || 'Unknown',
        youtubeUrl: caseData.youtubeUrl,
        channelName: caseData.metadata?.channelName || 'Unknown',
        publishDate: caseData.metadata?.publishDate || new Date(),
        duration: caseData.metadata?.durationSeconds || 0,
        viewCount: caseData.metadata?.viewCount || 0
      },
      detectionResults: {
        totalSuspectsAnalyzed: suspects.length,
        highRiskMatches: highRisk.length,
        mediumRiskMatches: mediumRisk.length,
        lowRiskMatches: lowRisk.length,
        strongestMatch: strongest ? {
          confidence: strongest.confidenceScore,
          youtubeUrl: `https://youtube.com/watch?v=${strongest.youtubeVideoId}`,
          title: strongest.title
        } : {
          confidence: 0,
          youtubeUrl: '',
          title: 'No matches found'
        }
      },
      analysis: {
        processingTime: this.formatProcessingTime(caseData.createdAt, caseData.updatedAt),
        framesAnalyzed: caseData.totalFramesExtracted || 0,
        algorithmsUsed: ['Perceptual Hash', 'DCT Hash', 'TensorFlow Embeddings', 'Advanced Features'],
        confidenceThreshold: 0.7
      }
    };
  }

  private compileSuspectEvidence(suspects: SuspectVideo[]): EvidenceReport['suspects'] {
    return suspects.map((suspect, index) => ({
      rank: index + 1,
      youtubeVideoId: suspect.youtubeVideoId,
      title: suspect.title,
      channelName: suspect.channelName,
      youtubeUrl: `https://youtube.com/watch?v=${suspect.youtubeVideoId}`,
      riskLevel: suspect.riskLevel,
      confidence: suspect.confidenceScore,
      similarity: suspect.similarityScore,
      temporalAlignment: suspect.temporalAlignment,
      evidence: {
        sequenceMatches: (suspect.sequenceMatches || []).map(match => ({
          timeRange: `${this.formatTime(match.original_timestamp)} - ${this.formatTime(match.original_timestamp + match.duration)}`,
          confidence: match.confidence,
          frameCount: match.frame_matches,
          description: `${match.frame_matches} consecutive frames with ${(match.confidence * 100).toFixed(1)}% similarity`
        })),
        algorithmDetails: this.extractAlgorithmDetails(suspect.detectionDetails)
      },
      legalNotes: this.generateLegalNotes(suspect)
    }));
  }

  private generateTechnicalDetails(keyframes: VideoKeyframe[]): EvidenceReport['technicalDetails'] {
    return {
      methodology: 'Multi-modal AI-powered similarity detection using perceptual hashing, frequency domain analysis, and semantic embeddings. Our system employs state-of-the-art computer vision algorithms to detect potential copyright infringement through frame-by-frame comparison and temporal sequence analysis.',
      algorithms: [
        'Perceptual Hash (pHash) - Visual structure similarity detection resistant to minor modifications',
        'Discrete Cosine Transform (DCT) Hash - Frequency domain analysis for compression-resistant comparison',
        'TensorFlow MobileNetV2 Embeddings - Deep learning semantic content similarity',
        'Advanced Feature Analysis - Multi-dimensional color, texture, and edge pattern detection',
        'Dynamic Time Warping - Temporal sequence alignment for detecting edited content'
      ],
      thresholds: {
        perceptualHash: 0.85,
        dctHash: 0.80,
        semanticEmbedding: 0.75,
        overallConfidence: 0.70
      },
      qualityMetrics: {
        frameExtraction: `${keyframes.length} keyframes extracted at optimized intervals for comprehensive analysis`,
        hashGeneration: 'Enhanced AI-powered feature extraction with redundancy and error correction',
        similarityAnalysis: 'Multi-modal weighted analysis with temporal alignment verification and false positive reduction'
      }
    };
  }

  private generateRecommendations(suspects: SuspectVideo[]): EvidenceReport['recommendations'] {
    const highRisk = suspects.filter(s => s.riskLevel === 'HIGH');
    const mediumRisk = suspects.filter(s => s.riskLevel === 'MEDIUM');

    return {
      immediate: [
        ...(highRisk.length > 0 ? [
          `File DMCA takedown notices for ${highRisk.length} high-risk matches immediately`,
          'Submit YouTube copyright claims for highest confidence matches',
          'Document and preserve all evidence before suspected infringers can remove content',
          'Notify legal counsel of high-confidence infringement cases'
        ] : []),
        'Review and validate all matches before taking legal action',
        'Compile additional supporting evidence (channel history, upload patterns, metadata)',
        'Consider sending cease and desist letters to repeat offenders'
      ],
      followUp: [
        ...(mediumRisk.length > 0 ? [
          `Schedule manual review for ${mediumRisk.length} medium-risk matches within 48 hours`,
          'Monitor suspected channels for additional infringements or pattern recognition',
          'Analyze upload timing and content patterns for systematic infringement'
        ] : []),
        'Set up automated monitoring for future infringement detection',
        'Implement content watermarking for future video uploads',
        'Establish regular reporting schedule for ongoing monitoring results'
      ],
      legal: [
        'Consult with intellectual property attorney before filing formal legal complaints',
        'Gather additional evidence of financial damages if pursuing monetary claims',
        'Document any direct communication attempts with infringing parties',
        'Maintain detailed records of all enforcement actions taken for potential litigation',
        'Consider registering copyrights formally if not already completed',
        'Evaluate potential for class action if multiple infringers identified'
      ]
    };
  }

  private generateAppendices(): EvidenceReport['appendices'] {
    return {
      algorithmExplanation: 'Our multi-modal detection system combines four distinct similarity algorithms to provide robust copyright detection with high accuracy and low false positive rates. Perceptual hashing captures visual structure and layout, DCT analysis resists compression artifacts and format changes, semantic embeddings understand content meaning and context, and advanced features analyze color distribution, texture patterns, and edge characteristics. This comprehensive approach ensures reliable detection across various types of content modification and quality variations.',
      confidenceScoring: 'Confidence scores range from 0.0 to 1.0, representing the statistical probability of copyright infringement. Scores above 0.8 indicate high likelihood of infringement suitable for immediate legal action. Scores between 0.6-0.8 suggest probable infringement requiring manual review. Scores are calculated using weighted averages of individual algorithm results, with temporal sequence alignment providing additional validation. The scoring system has been trained on thousands of verified infringement cases to optimize accuracy.',
      limitations: 'This automated detection system provides strong statistical evidence of potential copyright infringement but should be combined with human review for legal proceedings. Detection accuracy may be affected by significant video modifications (heavy editing, filters, overlays), extremely low-quality uploads, or highly compressed content. The system is optimized for detecting substantial similarity and may not identify minor clips or heavily transformed derivatives. Legal consultation is recommended before pursuing formal action based solely on automated detection results.'
    };
  }

  private generateDmcaBody(suspect: SuspectVideo, claimant: { name: string; email: string; address: string; phone?: string }): string {
    return `
Dear Platform Administrator,

I am writing to notify you of copyright infringement on your platform pursuant to the Digital Millennium Copyright Act (17 U.S.C. § 512).

CLAIMANT INFORMATION:
Name: ${claimant.name}
Email: ${claimant.email}
Address: ${claimant.address}
${claimant.phone ? `Phone: ${claimant.phone}` : ''}

COPYRIGHTED WORK:
Title: ${suspect.videoProcessing?.videoTitle || 'Original Video'}
Original URL: ${suspect.videoProcessing?.youtubeUrl || 'N/A'}
Copyright Owner: ${claimant.name}

INFRINGING MATERIAL:
Title: ${suspect.title}
URL: https://youtube.com/watch?v=${suspect.youtubeVideoId}
Channel: ${suspect.channelName}

EVIDENCE OF INFRINGEMENT:
Our automated copyright detection system has identified this content with ${(suspect.confidenceScore * 100).toFixed(1)}% confidence as infringing material. The comprehensive analysis reveals:
- Visual similarity score: ${(suspect.similarityScore * 100).toFixed(1)}%
- Temporal alignment: ${(suspect.temporalAlignment * 100).toFixed(1)}%
- ${(suspect.sequenceMatches || []).length} matching sequence segments identified
- Multi-modal AI analysis confirms substantial similarity

GOOD FAITH STATEMENT:
I have a good faith belief that the use of the copyrighted material described above is not authorized by the copyright owner, its agent, or the law.

ACCURACY STATEMENT:
I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or am authorized to act on behalf of the copyright owner.

REQUESTED ACTION:
Please remove or disable access to this infringing material immediately and confirm removal within 24 hours.

Sincerely,
${claimant.name}
Date: ${new Date().toLocaleDateString()}
    `.trim();
  }

  private generateYouTubeClaimBody(suspect: SuspectVideo): string {
    return `
This video contains copyrighted content that infringes on my intellectual property rights.

ORIGINAL CONTENT INFORMATION:
Title: ${suspect.videoProcessing?.videoTitle || 'Original Video'}
Original URL: ${suspect.videoProcessing?.youtubeUrl || 'N/A'}
Copyright Status: Owned by claimant

INFRINGING CONTENT:
Video Title: ${suspect.title}
Channel Name: ${suspect.channelName}
Upload Date: ${new Date().toISOString().split('T')[0]}

EVIDENCE OF INFRINGEMENT:
Advanced AI-powered detection analysis confirms copyright infringement:
- Automated detection confidence: ${(suspect.confidenceScore * 100).toFixed(1)}%
- Visual content similarity: ${(suspect.similarityScore * 100).toFixed(1)}%
- Temporal pattern matching: ${(suspect.temporalAlignment * 100).toFixed(1)}%
- ${(suspect.sequenceMatches || []).length} matching sequence segments identified through frame-by-frame analysis

AUTHORIZATION:
I am the copyright owner of the original content and have not authorized this use, distribution, or reproduction in any form.

REQUESTED ACTION:
Please process this copyright claim and take appropriate action including content removal, revenue redirection, or account penalties as per YouTube's copyright policies.
    `.trim();
  }

  private compileEvidenceUrls(suspect: SuspectVideo): string[] {
    const urls = [
      `https://youtube.com/watch?v=${suspect.youtubeVideoId}`,
      suspect.videoProcessing?.youtubeUrl
    ].filter(Boolean);

    // Add any additional evidence URLs from detection details
    if (suspect.detectionDetails && typeof suspect.detectionDetails === 'object') {
      const details = suspect.detectionDetails as Record<string, unknown>;
      if (details.evidence_urls && Array.isArray(details.evidence_urls)) {
        urls.push(...(details.evidence_urls as string[]));
      }
    }

    return urls;
  }

  private extractAlgorithmDetails(detectionDetails: unknown): {
    perceptualSimilarity: number;
    dctSimilarity: number;
    semanticSimilarity: number;
    advancedFeatures: number;
  } {
    if (!detectionDetails || typeof detectionDetails !== 'object') {
      return {
        perceptualSimilarity: 0,
        dctSimilarity: 0,
        semanticSimilarity: 0,
        advancedFeatures: 0
      };
    }

    const details = detectionDetails as Record<string, unknown>;
    const algorithmDetails = details.algorithm_details as Record<string, unknown> || {};

    return {
      perceptualSimilarity: Number(algorithmDetails.perceptual_similarity || 0),
      dctSimilarity: Number(algorithmDetails.dct_similarity || 0),
      semanticSimilarity: Number(algorithmDetails.embedding_similarity || 0),
      advancedFeatures: Number(algorithmDetails.advanced_similarity || 0)
    };
  }

  private generateLegalNotes(suspect: SuspectVideo): string[] {
    const notes: string[] = [];

    if (suspect.confidenceScore >= 0.9) {
      notes.push('Extremely high confidence match - strong evidence for immediate legal action');
      notes.push('Suitable for fast-track DMCA takedown proceedings');
    } else if (suspect.confidenceScore >= 0.8) {
      notes.push('High confidence match - good evidence for copyright claim with legal standing');
      notes.push('Recommended for formal copyright enforcement action');
    } else if (suspect.confidenceScore >= 0.7) {
      notes.push('Moderate confidence - recommend comprehensive manual review before legal action');
      notes.push('May require additional evidence gathering for stronger legal case');
    } else if (suspect.confidenceScore >= 0.6) {
      notes.push('Lower confidence - requires careful evaluation and possibly additional evidence');
    }

    const sequenceCount = (suspect.sequenceMatches || []).length;
    if (sequenceCount > 5) {
      notes.push(`${sequenceCount} sequence matches provide very strong temporal evidence of copying`);
    } else if (sequenceCount > 3) {
      notes.push(`${sequenceCount} sequence matches provide strong temporal evidence of infringement`);
    } else if (sequenceCount > 1) {
      notes.push(`${sequenceCount} sequence matches provide supporting evidence of similarity`);
    }

    if (suspect.temporalAlignment > 0.9) {
      notes.push('Extremely high temporal alignment indicates frame-by-frame copying or minimal editing');
    } else if (suspect.temporalAlignment > 0.8) {
      notes.push('High temporal alignment suggests direct copying with possible minor modifications');
    } else if (suspect.temporalAlignment > 0.6) {
      notes.push('Moderate temporal alignment suggests partial copying or significant editing');
    }

    // Risk-specific legal considerations
    switch (suspect.riskLevel) {
      case 'HIGH':
        notes.push('HIGH risk classification: Immediate legal action recommended with strong likelihood of success');
        notes.push('Consider expedited removal procedures and potential damages claim');
        break;
      case 'MEDIUM':
        notes.push('MEDIUM risk classification: Legal action viable with additional evidence compilation');
        notes.push('Recommend thorough documentation before proceeding with formal claims');
        break;
      case 'LOW':
        notes.push('LOW risk classification: Monitor for additional evidence or pattern establishment');
        notes.push('May be suitable for informal resolution attempts before legal escalation');
        break;
    }

    // Ensure at least one note exists
    if (notes.length === 0) {
      notes.push('Automated detection analysis completed - legal consultation recommended for case assessment');
    }

    return notes;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private formatProcessingTime(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH': return '#e74c3c';
      case 'MEDIUM': return '#f39c12';
      case 'LOW': return '#95a5a6';
      default: return '#000000';
    }
  }

  private getWordRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH': return 'e74c3c';
      case 'MEDIUM': return 'f39c12';
      case 'LOW': return '95a5a6';
      default: return '000000';
    }
  }

  private generateReportId(): string {
    return `REPORT_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  private generateNoticeId(): string {
    return `NOTICE_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
