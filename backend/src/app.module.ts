import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Authentication (keeping this - it's working)
import { AuthModule } from './auth/auth.module';

// NEW: Copyright Shield modules
import { CertificatesModule } from './certificates/certificates.module';
import { AnalysisModule } from './analysis/analysis.module';

// NEW: Copyright Shield entities
import { Certificate } from './database/entities/certificate.entity';
import { SimilarityAnalysis } from './database/entities/similarity-analysis.entity';

// KEEPING: WorksModule (if it contains user's creative works - fits Copyright Shield)
import { WorksModule } from './works/works.module';
import { FraudDetectionModule } from './fraud/fraud-detection.module';
import { AuditLogModule } from './audit-log/audit-log.module';

import { FraudReport } from './database/entities/fraud-report.entity';
import { AuditLog } from './database/entities/audit-log.entity';

@Module({
  imports: [
    // Database configuration with NEW entities
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        // UPDATED: Only Copyright Shield entities
        entities: [
          Certificate,
          SimilarityAnalysis,
          FraudReport,
          AuditLog
          // Add any WorksModule entities here if they exist
        ],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService]
    }),
    
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Core modules
    AuthModule,              // ✅ KEEP - Working authentication
    WorksModule,             // ✅ KEEP - User's creative works (fits Copyright Shield)
    
    // NEW: Copyright Shield modules
    CertificatesModule,      // 🆕 Digital certificate generation ($7 service)
    AnalysisModule,
    FraudDetectionModule,          // 🆕 Video similarity analysis ($25 service)
    AuditLogModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
