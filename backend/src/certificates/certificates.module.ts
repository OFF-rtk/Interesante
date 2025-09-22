import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { Certificate } from '../database/entities/certificate.entity';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate]), AuditLogModule],
  providers: [CertificatesService],
  controllers: [CertificatesController],
  exports: [CertificatesService]
})
export class CertificatesModule {}
