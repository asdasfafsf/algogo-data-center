import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NemoModule } from './nemo/nemo.module';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { validationSchema } from './config/validationSchema';
import { NemoConfig } from './config/NemoConfig';
import { PrismaModule } from './prisma/prisma.module';
import { BatchModule } from './batch/batch.module';
import { DiscoveryModule } from '@nestjs/core';
import { WorkerModule } from './worker/worker.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { JobModule } from './job/job.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BullMQConfig } from './config/BullMQConfig';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [NemoConfig, BullMQConfig],
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      validationSchema,
    }),
    BullModule.forRootAsync({
      useFactory: async (bullmqConfig: ConfigType<typeof BullMQConfig>) => ({
        connection: {
          host: bullmqConfig.host,
          port: bullmqConfig.port,
          password: bullmqConfig.password,
        },
      }),
      inject: [BullMQConfig.KEY],
    }),
    CacheModule.register(),
    DiscoveryModule,
    NemoModule,
    PrismaModule,
    BatchModule,
    WorkerModule,
    OrchestratorModule,
    JobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
