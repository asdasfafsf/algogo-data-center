import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { DiscoveryModule } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { OrchestratorRepository } from './orchestrator.repository';
import { BullMQConfig } from 'src/config/BullMQConfig';
import { ConfigType } from '@nestjs/config';
import { FlowProducer } from 'bullmq';
import { ORCHESTRATOR_FLOW_PRODUCER } from './constants/injection';
import { OrchestratorController } from './orchestrator.controller';

@Module({
  imports: [PrismaModule, DiscoveryModule],
  providers: [
    {
      provide: ORCHESTRATOR_FLOW_PRODUCER,
      useFactory: (bullmqConfig: ConfigType<typeof BullMQConfig>) =>
        new FlowProducer({ connection: bullmqConfig }),
      inject: [BullMQConfig.KEY],
    },
    OrchestratorService,
    OrchestratorRepository,
  ],
  exports: [OrchestratorService],
  controllers: [OrchestratorController],
})
export class OrchestratorModule {}
