import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    UploadedFiles,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { User } from '../decorators/user.decorator';
import { AnalysisService } from './analysis.service';
  
  // Type guard for file validation
  function isValidMulterFileArray(files: unknown): files is Express.Multer.File[] {
    return (
      Array.isArray(files) &&
      files.length === 2 &&
      files.every(file => 
        typeof file === 'object' &&
        file !== null &&
        'buffer' in file &&
        'originalname' in file &&
        'mimetype' in file &&
        'size' in file
      )
    );
  }
  
  @Controller('analysis')
  @UseGuards(AuthGuard('jwt'))
  export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) {}
  
    @Post('similarity')
    @UseInterceptors(FilesInterceptor('videos', 2, {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'video/mp4', 
          'video/avi', 
          'video/mov', 
          'video/mkv', 
          'video/webm',
          'video/flv'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new HttpException(
              `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(', ')}`, 
              HttpStatus.BAD_REQUEST
            ), 
            false
          );
        }
      }
    }))
    async analyzeSimilarity(
      @UploadedFiles() files: unknown,
      @User() userId: string
    ) {
      // Type-safe file validation
      if (!isValidMulterFileArray(files)) {
        throw new HttpException(
          'Exactly 2 video files are required for similarity analysis', 
          HttpStatus.BAD_REQUEST
        );
      }
  
      // Validate file sizes
      for (const file of files) {
        const fileSize = Number(file.size);
        if (!Number.isInteger(fileSize) || fileSize <= 0) {
          throw new HttpException(
            `Invalid file size for ${file.originalname}`, 
            HttpStatus.BAD_REQUEST
          );
        }
        
        if (fileSize > 100 * 1024 * 1024) {
          throw new HttpException(
            `File ${file.originalname} exceeds 100MB limit`, 
            HttpStatus.BAD_REQUEST
          );
        }
      }
  
      const [originalFile, suspectedFile] = files;
      return this.analysisService.analyzeSimilarity(originalFile, suspectedFile, userId);
    }
  
    @Get('user')
    async getUserAnalyses(@User() userId: string) {
      return this.analysisService.getUserAnalyses(userId);
    }
  
    @Get('verify/:analysisId')
    async verifyAnalysis(
      @Param('analysisId', ParseUUIDPipe) analysisId: string
    ) {
      return this.analysisService.verifyAnalysis(analysisId);
    }
  
    @Get(':analysisId')
    async getAnalysis(
      @Param('analysisId', ParseUUIDPipe) analysisId: string,
      @User() userId: string
    ) {
      return this.analysisService.getAnalysisById(analysisId, userId);
    }
  }
  