import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_INTERCEPTOR, DiscoveryModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BatchModule } from './batch/batch.module';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { BullMQConfig } from './config/BullMQConfig';
import { NemoConfig } from './config/NemoConfig';
import { S3Config } from './config/S3Config';
import { TodayProblemConfig } from './config/TodayProblemConfig';
import { validationSchema } from './config/validationSchema';
import { JobModule } from './job/job.module';
import { NemoModule } from './nemo/nemo.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProblemModule } from './problem/problem.module';
import { S3Module } from './s3/s3.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [NemoConfig, BullMQConfig, S3Config, TodayProblemConfig],
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
