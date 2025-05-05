import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { BullModule } from '@nestjs/bullmq';
import { BullMQConfig } from '../config/BullMQConfig';
import { ConfigType } from '@nestjs/config';
import { JobModule } from 'src/job/job.module';

@Module({
  providers: [WorkerService],
  exports: [WorkerService],
  imports: [
    BullModule.registerQueueAsync({
      useFactory: async (bullmqConfig: ConfigType<typeof BullMQConfig>) => ({
        connection: bullmqConfig,
      }),
      inject: [BullMQConfig.KEY],
    }),
    JobModule,
  ],
})
export class WorkerModule {}
