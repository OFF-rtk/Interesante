import { Module } from '@nestjs/common';
import { DetectiveAgentController } from './detective-agent.controller';
import { DetectiveAgentService } from './detective-agent.service';

import { VideoProcessing } from 'src/database/entities/video-processing.entity';
import { VideoKeyframe } from 'src/database/entities/video-keyframe.entity';
import { SuspectVideo } from 'src/database/entities/suspect-video.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoMetadata } from 'src/database/entities/video-metadata.entity';
import { YouTubeSearchService } from './services/youtube-search.service';
import { CachingService } from './services/caching.service';
import { EvidenceCompilerService } from './services/evidence-compiler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VideoProcessing,
      VideoKeyframe,
      SuspectVideo,
      VideoMetadata
    ])
  ],
  providers: [DetectiveAgentService, YouTubeSearchService, CachingService, EvidenceCompilerService],
  controllers: [DetectiveAgentController],
  exports: [DetectiveAgentService, YouTubeSearchService, CachingService, EvidenceCompilerService]
})
export class DetectiveModule {}
