// src/analysis/analysis.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { SimilarityAnalysis } from '../database/entities/similarity-analysis.entity';

@Module({
  imports: [
    // CRITICAL: This creates the SimilarityAnalysisRepository
    TypeOrmModule.forFeature([SimilarityAnalysis])
  ],
  providers: [AnalysisService],
  controllers: [AnalysisController],
  exports: [AnalysisService]
})
export class AnalysisModule {}
