import { Module } from '@nestjs/common';
import { IntakeModule } from './intake/intake.module';
import { ProcessingModule } from './processing/processing.module';

@Module({
  imports: [IntakeModule, ProcessingModule]
})
export class AgentsModule {}
