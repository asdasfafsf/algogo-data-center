import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrchestratorService } from './orchestrator.service';

@Controller('api/v1/orchestrator')
export class OrchestratorController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  @Get()
  async test(@Query('problemId') problemId: string) {
    return await this.orchestratorService.orchestrate('PROBLEM_BOJ', {
      sourceId: problemId,
      source: 'acmicpc',
    });
  }

  @Get('test')
  async job(@Query('currentDate') currentDate: number) {
    return await this.orchestratorService.orchestrate('PROBLEM_BOJ_TODAY', {
      currentDate: Number(currentDate),
    });
  }
}
