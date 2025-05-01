import { Module, OnModuleInit } from '@nestjs/common';
import { JobRegistry } from '../job/job-registry';
import { DiscoveryModule } from '@nestjs/core';
import { DispatcherService } from '../job/dispatcher.service';
import { BatchService } from './batch.service';
import { BatchRepository } from './batch.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { BatchPlanRegistry } from './batch-plan.registry';
import { BatchPlanService } from './batch.plan.service';
@Module({
  imports: [
    DiscoveryModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    OrchestratorModule,
  ],
  providers: [
    JobRegistry,
    DispatcherService,
    BatchService,
    BatchRepository,
    BatchPlanRegistry,
    BatchPlanService,
  ],
  exports: [DispatcherService, JobRegistry],
})
export class BatchModule implements OnModuleInit {
  constructor(private readonly batchService: BatchService) {}
  async onModuleInit() {
    await this.batchService.synchronizeBatchDefinition();
  }
}
