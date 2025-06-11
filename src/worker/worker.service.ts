import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DispatcherService } from '../job/dispatcher.service';
import { JobHandlerKey } from '../job/types/job.type';

@Injectable()
@Processor(process.env.BULLMQ_QUEUE_NAME)
export class WorkerService extends WorkerHost {
  private readonly logger = new Logger(WorkerService.name);
  constructor(private readonly dispatcherService: DispatcherService) {
    super();
  }
  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id}`);
    const result = await this.dispatcherService.dispatch(
      job.name as JobHandlerKey,
      job.data,
    );
    this.logger.log(`Processed job ${job.id}`);
    return result;
  }
}
