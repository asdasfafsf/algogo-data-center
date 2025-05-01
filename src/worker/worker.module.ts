import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { BatchModule } from 'src/batch/batch.module';

@Module({
  providers: [WorkerService],
  exports: [WorkerService],
  imports: [BatchModule],
})
export class WorkerModule {}
