import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { DiscoveryModule } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { OrchestratorRepository } from './orchestrator.repository';
import { BullModule } from '@nestjs/bullmq';
import { BullMQConfig } from '../config/BullMQConfig';
import { ConfigType } from '@nestjs/config';
@Module({
  providers: [OrchestratorService, OrchestratorRepository],
  exports: [OrchestratorService],
  imports: [
    PrismaModule,
    DiscoveryModule,
    BullModule.registerFlowProducerAsync({
      useFactory: async (bullmqConfig: ConfigType<typeof BullMQConfig>) => ({
        connection: bullmqConfig,
        queueName: bullmqConfig.queueName,
      }),
      inject: [BullMQConfig.KEY],
    }),
  ],
})
export class OrchestratorModule {}
