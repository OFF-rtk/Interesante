import { Module } from '@nestjs/common';
import { IntakeAgentService } from './intake-agent.service';
import { IntakeAgentController } from './intake-agent.controller';

@Module({
  providers: [IntakeAgentService],
  controllers: [IntakeAgentController]
})
export class IntakeModule {}
