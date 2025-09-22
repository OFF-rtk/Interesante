import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import FormData from 'form-data';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import fetch, { Response } from 'node-fetch';
import PDFDocument from 'pdfkit';
import { Repository } from 'typeorm';
import { SimilarityAnalysis } from '../database/entities/similarity-analysis.entity';
import {
    AIAnalysisResponse,
    AnalysisReportData,
    MatchedFrame,
} from '../interfaces/analysis.interface';

// Custom error classes
class AnalysisError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'AnalysisError';
  }
}

class AIServiceError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// Type guard for AI service response validation
function isValidAIAnalysisResponse(data: unknown): data is AIAnalysisResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const response = data as Record<string, unknown>;
  
  if (typeof response.status !== 'string') {
    return false;
  }
  
  if (response.status === 'success') {
    return (
      typeof response.analysis === 'object' &&
      response.analysis !== null &&
      typeof (response.analysis as Record<string, unknown>).similarity_analysis === 'object'
    );
  }
  
  return true; // Error responses just need status
}

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(SimilarityAnalysis)
    private readonly analysisRepository: Repository<SimilarityAnalysis>
  ) {}

  async analyzeSimilarity(
    originalFile: Express.Multer.File, 
    suspectedFile: Express.Multer.File, 
    userId: string
  ) {
    let originalPath: string | null = null;
    let suspectedPath: string | null = null;
    
    try {
      // Validate file buffers
      if (!originalFile.buffer || originalFile.buffer.length === 0) {
        throw new AnalysisError('Invalid original file: no content found');
      }
      
      if (!suspectedFile.buffer || suspectedFile.buffer.length === 0) {
        throw new AnalysisError('Invalid suspected file: no content found');
      }

      // Safe filename handling
      const safeOriginalName = String(originalFile.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
      const safeSuspectedName = String(suspectedFile.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Save files temporarily
      const timestamp = Date.now();
      originalPath = `/tmp/${timestamp}_original_${safeOriginalName}`;
      suspectedPath = `/tmp/${timestamp}_suspected_${safeSuspectedName}`;
      
      writeFileSync(originalPath, originalFile.buffer);
      writeFileSync(suspectedPath, suspectedFile.buffer);

      // Call AI service with proper FormData
      const formData = new FormData();
      formData.append('original', createReadStream(originalPath), {
        filename: safeOriginalName,
        contentType: String(originalFile.mimetype || 'video/mp4'),
      });
      formData.append('suspected', createReadStream(suspectedPath), {
        filename: safeSuspectedName,
        contentType: String(suspectedFile.mimetype || 'video/mp4'),
      });

      const response: Response = await fetch('http://ai-service:5000/analyze-similarity', {
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

      // Safe JSON parsing with validation
      const rawResponse: unknown = await response.json();
      
      if (!isValidAIAnalysisResponse(rawResponse)) {
        throw new AIServiceError('Invalid response format from AI service');
      }

      const aiResult: AIAnalysisResponse = rawResponse;
      
      if (aiResult.status !== 'success' || !aiResult.analysis) {
        throw new AIServiceError(aiResult.error || 'AI service returned error');
      }

      // Safe data extraction
      const analysisData = aiResult.analysis;
      const similarity = analysisData.similarity_analysis;
      
      // Generate analysis ID
      const analysisTimestamp = Date.now();
      const originalHash = String(analysisData.files.original.sha256);
      const suspectedHash = String(analysisData.files.suspected.sha256);
      const analysisId = `SA-${analysisTimestamp}-${originalHash.substring(0, 8)}-${suspectedHash.substring(0, 8)}`;

      // Safe number conversions
      const visualSimilarity = Number(similarity.visual_similarity);
      const temporalAlignment = Number(similarity.temporal_alignment);
      const overallConfidence = Number(similarity.overall_confidence);

      if (!Number.isFinite(visualSimilarity) || !Number.isFinite(temporalAlignment) || !Number.isFinite(overallConfidence)) {
        throw new AnalysisError('Invalid similarity metrics from AI service');
      }

      // Save to database
      const analysis = this.analysisRepository.create({
        analysisId,
        userId: String(userId),
        originalFilename: String(originalFile.originalname),
        suspectedFilename: String(suspectedFile.originalname),
        originalSha256: originalHash,
        suspectedSha256: suspectedHash,
        visualSimilarity,
        temporalAlignment,
        overallConfidence,
        matchedFrames: similarity.matched_frames,
        analysisMetadata: similarity.analysis_metadata,
      });

      await this.analysisRepository.save(analysis);

      // Generate PDF report
      const reportData: AnalysisReportData = {
        analysisId,
        timestamp: new Date().toISOString(),
        files: analysisData.files,
        similarity_analysis: similarity,
        technical_metadata: analysisData.technical_metadata,
        reportHash: createHash('sha256').update(JSON.stringify(similarity)).digest('hex'),
        verificationUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/analysis/verify/${analysisId}`
      };

      const reportPDF = await this.generateAnalysisReport(reportData);

      return {
        analysis: {
          id: analysisId,
          visualSimilarity,
          temporalAlignment,
          overallConfidence,
          reportUrl: `data:application/pdf;base64,${reportPDF.toString('base64')}`,
          metadata: analysisData
        }
      };

    } catch (error) {
      // Proper error handling
      if (error instanceof AnalysisError || error instanceof AIServiceError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      if (error instanceof Error) {
        throw new HttpException(
          `Analysis failed: ${error.message}`, 
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      
      throw new HttpException(
        'An unexpected error occurred during analysis', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      // Clean up temporary files
      if (originalPath) {
        try {
          unlinkSync(originalPath);
        } catch (cleanupError) {
          console.warn('Failed to cleanup original file:', cleanupError);
        }
      }
      
      if (suspectedPath) {
        try {
          unlinkSync(suspectedPath);
        } catch (cleanupError) {
          console.warn('Failed to cleanup suspected file:', cleanupError);
        }
      }
    }
  }

  private async generateAnalysisReport(reportData: AnalysisReportData): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (error: Error) => reject(new AnalysisError(
          'PDF generation failed', 
          error
        )));

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('VIDEO SIMILARITY ANALYSIS REPORT', { align: 'center' });
        
        doc.moveDown();
        
        // Analysis Info
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Analysis ID: ${reportData.analysisId}`)
           .text(`Analysis Date: ${reportData.timestamp}`)
           .text('Generated by: Copyright Shield AI Engine v1.0');

        doc.moveDown();

        // Files Compared
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('FILES COMPARED');
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Original: ${reportData.files.original.filename} (${reportData.files.original.size} bytes)`)
           .text(`Original SHA-256: ${reportData.files.original.sha256}`)
           .text(`Suspected: ${reportData.files.suspected.filename} (${reportData.files.suspected.size} bytes)`)
           .text(`Suspected SHA-256: ${reportData.files.suspected.sha256}`);

        doc.moveDown();

        // Similarity Results
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('SIMILARITY ANALYSIS RESULTS');
        
        const visualPercent = (reportData.similarity_analysis.visual_similarity * 100).toFixed(2);
        const temporalPercent = (reportData.similarity_analysis.temporal_alignment * 100).toFixed(2);
        const confidencePercent = (reportData.similarity_analysis.overall_confidence * 100).toFixed(2);
        
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Visual Similarity: ${visualPercent}%`)
           .text(`Temporal Alignment: ${temporalPercent}%`)
           .text(`Overall Confidence: ${confidencePercent}%`);

        doc.moveDown();

        // Frame Analysis
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('FRAME ANALYSIS SUMMARY');
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Original Frames: ${reportData.similarity_analysis.frame_count_original}`)
           .text(`Suspected Frames: ${reportData.similarity_analysis.frame_count_suspected}`)
           .text(`Matched Frames: ${reportData.similarity_analysis.matched_frames.length}`);

        // Matched Frames Details
        if (reportData.similarity_analysis.matched_frames.length > 0) {
          doc.moveDown();
          doc.text('TOP MATCHED FRAMES:');
          
          reportData.similarity_analysis.matched_frames
            .slice(0, 10) // Top 10 matches
            .forEach((match: MatchedFrame, index: number) => {
              const matchPercent = (match.similarity * 100).toFixed(1);
              doc.text(`${index + 1}. Frame ${match.original_frame} → ${match.suspected_frame} (${matchPercent}% match)`);
            });
        }

        doc.moveDown();

        // Technical Details
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('TECHNICAL METADATA');
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Processing Engine: ${reportData.technical_metadata.processing_engine}`)
           .text(`Algorithms Used: ${reportData.technical_metadata.algorithms_used.join(', ')}`)
           .text(`Analysis Timestamp: ${reportData.technical_metadata.analysis_timestamp}`);

        doc.moveDown();

        // Legal Disclaimer
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('ANALYSIS VALIDITY & DISCLAIMERS');
        
        doc.fontSize(9)
           .font('Helvetica')
           .text('This analysis report provides technical similarity assessment only and does not constitute ')
           .text('legal advice or definitive proof of copyright infringement. The similarity metrics are ')
           .text('generated using computer vision algorithms and should be interpreted by qualified professionals.');

        doc.moveDown();
        
        // Verification
        doc.text(`Verification URL: ${reportData.verificationUrl}`)
           .text(`Report Hash: ${reportData.reportHash}`);

        doc.end();

      } catch (error) {
        reject(new AnalysisError(
          'PDF generation setup failed', 
          error
        ));
      }
    });
  }

  async getUserAnalyses(userId: string) {
    const safeUserId = String(userId).trim();
    if (!safeUserId) {
      throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
    }

    return this.analysisRepository.find({
      where: { userId: safeUserId },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'analysisId',
        'originalFilename',
        'suspectedFilename',
        'visualSimilarity',
        'temporalAlignment',
        'overallConfidence',
        'createdAt'
      ]
    });
  }

  async verifyAnalysis(analysisId: string) {
    const analysis = await this.analysisRepository.findOne({
      where: { analysisId: String(analysisId).trim() }
    });

    if (!analysis) {
      throw new HttpException('Analysis not found', HttpStatus.NOT_FOUND);
    }

    return {
      valid: true,
      analysis: {
        id: analysis.analysisId,
        createdAt: analysis.createdAt,
        originalFilename: analysis.originalFilename,
        suspectedFilename: analysis.suspectedFilename,
        confidence: analysis.overallConfidence
      }
    };
  }

  async getAnalysisById(analysisId: string, userId: string) {
    const analysis = await this.analysisRepository.findOne({
      where: { 
        analysisId: String(analysisId).trim(),
        userId: String(userId).trim()
      }
    });

    if (!analysis) {
      throw new HttpException(
        'Analysis not found or access denied', 
        HttpStatus.NOT_FOUND
      );
    }

    return analysis;
  }
    
}
