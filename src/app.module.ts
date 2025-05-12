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
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { ProblemModule } from './problem/problem.module';
import { BullModule } from '@nestjs/bullmq';
import { S3Module } from './s3/s3.module';
import { S3Config } from './config/S3Config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [NemoConfig, BullMQConfig, S3Config],
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      validationSchema,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      useFactory: (bullmqConfig: ConfigType<typeof BullMQConfig>) => ({
        connection: bullmqConfig,
      }),
      inject: [BullMQConfig.KEY],
    }),
    ScheduleModule.forRoot(),
    DiscoveryModule,
    NemoModule,
    PrismaModule,
    BatchModule,
    WorkerModule,
    JobModule,
    ProblemModule,
    OrchestratorModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
  ],
})
export class AppModule {}
