import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VideoProcessing } from "src/database/entities/video-processing.entity";
import { VideoMetadata } from "src/database/entities/video-metadata.entity";
import { VideoKeyframe } from "src/database/entities/video-keyframe.entity";
import { ProcessingAgentService } from './processing-agent.service';
import { ProcessingAgentController } from './processing-agent.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            VideoProcessing,
            VideoMetadata,
            VideoKeyframe
        ])
    ],
    providers: [ProcessingAgentService],
    controllers: [ProcessingAgentController],
    exports: [ProcessingAgentService]
})

export class ProcessingModule {}
