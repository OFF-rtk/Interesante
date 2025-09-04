import { Module } from '@nestjs/common';
import { DetectiveAgentController } from './detective-agent.controller';
import { DetectiveAgentService } from './detective-agent.service';

import { VideoProcessing } from 'src/database/entities/video-processing.entity';
import { VideoKeyframe } from 'src/database/entities/video-keyframe.entity';
import { SuspectVideo } from 'src/database/entities/suspect-video.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VideoProcessing,
      VideoKeyframe,
      SuspectVideo
    ])
  ],
  providers: [DetectiveAgentService],
  controllers: [DetectiveAgentController],
  exports: [DetectiveAgentService]
})
export class DetectiveModule {}
