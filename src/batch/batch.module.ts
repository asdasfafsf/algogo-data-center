import { Module, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { BatchService } from './batch.service';
import { BatchRepository } from './batch.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { BatchPlanRegistry } from './batch-plan.registry';
import { BatchPlanService } from './batch-plan.service';
import { BatchController } from './batch.controller';
import { ProblemBojPlan } from './plans/problem-boj.plan';
import { TodayProblemBojPlan } from './plans/today-problem-boj.plan';
@Module({
  imports: [DiscoveryModule, PrismaModule, OrchestratorModule],
  providers: [
    BatchService,
    BatchRepository,
    BatchPlanRegistry,
    BatchPlanService,
    ProblemBojPlan,
    TodayProblemBojPlan,
  ],
  exports: [],
  controllers: [BatchController],
})
export class BatchModule implements OnModuleInit {
  constructor(private readonly batchService: BatchService) {}
  async onModuleInit() {
    await this.batchService.synchronizeBatchDefinition();
  }
}
