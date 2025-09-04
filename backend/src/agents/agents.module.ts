import { Module } from '@nestjs/common';
import { IntakeModule } from './intake/intake.module';
import { ProcessingModule } from './processing/processing.module';
import { DetectiveModule } from './detective/detective.module';

@Module({
  imports: [IntakeModule, ProcessingModule, DetectiveModule]
})
export class AgentsModule {}
