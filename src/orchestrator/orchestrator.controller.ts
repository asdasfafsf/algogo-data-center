import { Controller, Get, Query } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';

@Controller('api/v1/orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get()
  async test(@Query('problemId') problemId: string) {
    return await this.orchestratorService.orchestrate('PROBLEM_BOJ', {
      sourceId: problemId,
      source: 'acmicpc',
    });
  }
}
