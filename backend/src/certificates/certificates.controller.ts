import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, UseGuards, HttpException, HttpStatus, Request, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../decorators/user.decorator';
import { CertificatesService } from './certificates.service';

// DTO for user agreement validation
interface UserAgreementDto {
  tosVersion?: string;
  userOwnershipWarranty?: string | boolean;
  platformDisclaimerAccepted?: string | boolean;
}

@Controller('certificates')
@UseGuards(AuthGuard('jwt'))
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('video', {
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, callback) => {
      const allowedMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new HttpException('Invalid file type', HttpStatus.BAD_REQUEST), false);
      }
    }
  }))
  async generateCertificate(
    @UploadedFile() file: Express.Multer.File,
    @User() user: any,
    @Body() body: UserAgreementDto,
    @Request() req: any
  ) {
    if (!file) {
      throw new HttpException('No video file provided', HttpStatus.BAD_REQUEST);
    }

    // Extract and validate user agreement
    const userAgreement = {
      tosVersion: body.tosVersion || '1.0',
      userOwnershipWarranty: this.parseBoolean(body.userOwnershipWarranty),
      platformDisclaimerAccepted: this.parseBoolean(body.platformDisclaimerAccepted),
      ipAddress: req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    // Validate required agreements
    if (!userAgreement.userOwnershipWarranty) {
      throw new HttpException(
        'User must warrant ownership of the uploaded content', 
        HttpStatus.BAD_REQUEST
      );
    }

    if (!userAgreement.platformDisclaimerAccepted) {
      throw new HttpException(
        'User must accept platform disclaimers and Terms of Service', 
        HttpStatus.BAD_REQUEST
      );
    }

    // Get user ID from JWT token
    const userId = user.sub || user.id || user.user_id;
    if (!userId) {
      throw new HttpException('Invalid user authentication', HttpStatus.UNAUTHORIZED);
    }

    return this.certificatesService.generateCertificate(file, userId, userAgreement);
  }

  @Get('verify/:certificateId')
  // ✅ REMOVED async since no await needed
  verifyCertificate(@Param('certificateId') certificateId: string) {
    return this.certificatesService.verifyCertificate(certificateId);
  }

  @Get('user')
  // ✅ REMOVED async since no await needed
  getUserCertificates(@User() user: any) {
    const userId = user.sub || user.id || user.user_id;
    if (!userId) {
      throw new HttpException('Invalid user authentication', HttpStatus.UNAUTHORIZED);
    }
    
    return this.certificatesService.getUserCertificates(userId);
  }

  // ❌ REMOVED - This method doesn't exist in the service
  // @Get('status/:certificateId')
  // async getCertificateStatus(...) { ... }

  // Private helper method
  private parseBoolean(value: string | boolean | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return false;
  }
}
