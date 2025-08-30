import { Module } from '@nestjs/common';
import { IntakeAgentService } from './intake-agent.service';
import { IntakeAgentController } from './intake-agent.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoProcessing } from 'src/database/entities/video-processing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoProcessing])
  ],
  providers: [IntakeAgentService],
  controllers: [IntakeAgentController],
  exports: [IntakeAgentService]
})
export class IntakeModule {}
