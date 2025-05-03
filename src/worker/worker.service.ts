import { Injectable } from '@nestjs/common';
import { DispatcherService } from '../job/dispatcher.service';
import { JobHandlerKey } from '../job/types/job.type';

@Injectable()
export class WorkerService {
  constructor(private readonly dispatcherService: DispatcherService) {}

  async dispatch(key: JobHandlerKey, data: any) {
    return await this.dispatcherService.dispatch(key, data);
  }
}
