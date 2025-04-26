import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { DispatcherService } from '../batch/dispatcher.service';

@Module({
  providers: [WorkerService],
  exports: [WorkerService],
  imports: [DispatcherService],
})
export class WorkerModule {}
