import { Module, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { BatchService } from './batch.service';
import { BatchRepository } from './batch.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { BatchPlanRegistry } from './batch-plan.registry';
import { BatchPlanService } from './batch-plan.service';
import { BatchController } from './batch.controller';
@Module({
  imports: [
    DiscoveryModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    OrchestratorModule,
  ],
  providers: [
    BatchService,
    BatchRepository,
    BatchPlanRegistry,
    BatchPlanService,
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
