import { Controller, Get } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';

@Controller('api/v1/orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get()
  async test() {
    return await this.orchestratorService.orchestrate('PROBLEM_BOJ', {
      sourceId: '24952',
      source: 'acmicpc',
    });
  }
}
