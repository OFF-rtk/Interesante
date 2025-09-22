import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudDetectionController } from './fraud-detection.controller';
import { FraudDetectionService } from './fraud-detection.service';
import { FraudReport } from '../database/entities/fraud-report.entity';
import { Certificate } from '../database/entities/certificate.entity';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FraudReport, Certificate]),
    AuditLogModule,
  ],
  providers: [FraudDetectionService],
  controllers: [FraudDetectionController],
  exports: [FraudDetectionService],
})
export class FraudDetectionModule {}
